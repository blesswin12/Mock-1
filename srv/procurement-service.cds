using procurement as db from '../db/schema';

service ProcurementService {
    entity Suppliers as projection on db.Suppliers;
    entity Products as Projection on db.Products;
    entity PurchaseOrders as projection on db.PurchaseOrders;
    entity OrderItems as projection on db.OrderItems;

    @requires: 'ProcurementManager'
    action submitOrder(orderID : UUID) returns {
        message: String
    }
}
