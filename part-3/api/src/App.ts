import express from 'express'
import { AppDataSource } from './data-source'
import { Product } from './entity/Product'
import { Category } from './entity/Category'
import { Subcategory } from './entity/Subcategory'
import { Supplier } from './entity/Supplier'
import { Uom } from './entity/Uom'
import { Warehouse } from './entity/Warehouse'
import postgraphile, { makePluginHook } from "postgraphile"
import { makeExtendSchemaPlugin, gql, embed } from "graphile-utils"
import { registerTransaction } from './service/inventory'
import cors from 'cors'
import PgPubsub from "@graphile/pg-pubsub"
import * as dotenv from 'dotenv'
dotenv.config();


const pluginHook = makePluginHook([PgPubsub]);


const RegisterTransactionPlugin = makeExtendSchemaPlugin(({ pgSql: sql }) => {
  return {
    typeDefs: gql`
      input RegisterTransactionInput {
        type: InventoryTransactionTypeEnum!
        productId: Int!
        warehouseId: Int!
        quantity: Int!
      }

      type RegisterTransactionPayload {
        transactionId: Int,
        productId: Int,
        warehouseId: Int,
        updatedQuantity: Int,
      }
      
      type categoryCreatedPayload{
        category: Category
        event: String
      }

      extend type Mutation {
        registerTransaction(input: RegisterTransactionInput!): RegisterTransactionPayload
      }      
      extend type Subscription {
         categoryCreated: categoryCreatedPayload @pgSubscription(topic: "graphql:category")
      }
    `,
    resolvers: {
      Mutation: {
        registerTransaction: async (_query, args, _context, _resolveInfo) => {
          try {
            const { type, productId, warehouseId, quantity } = args.input
            const inventoryTransaction = await registerTransaction(type, productId, warehouseId, quantity)
            return { ...inventoryTransaction }
          } catch (e) {
            console.error('Error registering transaction', e)
            throw e
          }
        }
      },
      categoryCreatedPayload: {
        async category(
            event,
            _args,
            context,
            { graphile: { selectGraphQLResultFromTable } }
        ) {
          console.log('event', event);
          const rows = await selectGraphQLResultFromTable(
              sql.fragment`category`,
              (tableAlias, sqlBuilder) => {
                sqlBuilder.where(
                    sql.fragment`${tableAlias}.id = ${sql.value(event.subject)}`
                );
              }
          );
          return rows[0];
        }
      }
    },
  };
});

/**
 * This is our main entry point of our Express server.
 * All the routes in our API are going to be here.
 **/
const App = () => {
  const app = express()
  app.use(express.json())
  app.use(cors()) // This needs to be added
  app.use(postgraphile(`postgresql://${process.env.PG_USER || 'admin'}:${process.env.PG_PASSWORD || 'admin'}@localhost/catalog_db`, 'public', {
    pluginHook,
    watchPg: true,
    graphiql: true,
    enhanceGraphiql: true,
    subscriptions: true,
    appendPlugins: [RegisterTransactionPlugin],
  }))

  app.get('/api/v1/hello', async (req, res, next) => {
    res.send('success')
  })

  app.post('/api/v1/test/data', async (req, res, next) => {
    // UOM
    const each = new Uom()
    each.name = 'Each'
    each.abbrev = 'EA'
    await AppDataSource.manager.save(each)

    // Category 
    const clothing = new Category()
    clothing.description = 'Clothing'
    await AppDataSource.manager.save(clothing)

    // Subcategories
    const tShirts = new Subcategory()
    tShirts.category = clothing
    tShirts.description = 'T-Shirts'

    const coat = new Subcategory()
    coat.category = clothing
    coat.description = 'Coat'
    await AppDataSource.manager.save([tShirts, coat])

    // Supplier
    const damageInc = new Supplier()
    damageInc.name = 'Damage Inc.'
    damageInc.address = '221B Baker St'
    await AppDataSource.manager.save(damageInc)

    // Warehouse
    const dc = new Warehouse()
    dc.name = 'DC'
    await AppDataSource.manager.save(dc)

    // Product
    const p1 = new Product()
    p1.category = clothing
    p1.description = 'Daily Black T-Shirt'
    p1.sku = 'ABC123'
    p1.subcategory = tShirts
    p1.uom = each

    const p2 = new Product()
    p2.category = clothing
    p2.description = 'Beautiful Coat'
    p2.sku = 'ZYX987'
    p2.subcategory = coat
    p2.uom = each

    // Note: this product intentionally does not have a subcategory
    // (it's configured to be nullable: true).
    const p3 = new Product()
    p3.category = clothing
    p3.description = 'White Glove'
    p3.sku = 'WG1234'
    p3.uom = each
    await AppDataSource.manager.save([p1, p2, p3])

    res.send('data seeding completed!')
  })

  return app
}

export default App
