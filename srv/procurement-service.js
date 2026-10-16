const cds = require('@sap/cds');
const { SELECT } = require('@sap/cds/lib/ql/cds-ql');
module.exports=cds.service.impl(function(){
    this.before(['CREATE','UPDATE'], 'Products', (req)=>{
        if(req.data.price<0){
            req.error(400,'Product price cannot be negative')
        }
    });

    this.before(['CREATE','UPDATE'], 'OrderItems', (req)=>{
        if(req.data.quantity == null || req.data.quantity<1){
            req.error(400, 'Product Quantity cannot be empty or Negative')
        }
    });

    this.before(['CREATE'],'PurchaseOrders',async(req)=>{
        console.log('Purchase order data:', JSON.stringify(req.data, null, 2));
        const supplierID = req.data.supplier_ID || req.data.supplier?.ID || req.data.supplier;
        if(!supplierID) {
            req.error(400,'A supplier is required for the purchase order');
            return;
        }
        const supplier = await cds.tx(req).run(SELECT.one.from('procurement.Suppliers').where({ ID: supplierID })
    );
        if(!supplier){
            req.error(400,'Supplier not found');
            return;
        }
        if(supplier.active === false ){
            req.error(400, 'Cannot create an order from an inactive supplier');
        }
    });

    this.after('READ', 'PurchaseOrders', async (orders,req)=>{
        const orderList = Array.isArray(orders)?orders:[orders];

        for(const order of orderList){
            if(!order) continue;

            const items = await cds.tx(req).run(
                SELECT.from('procurement.OrderItems')
                .columns('quantity', 'unitprice')
                .where({ order_ID: order.ID })
            );

            const total = items.reduce((sum,item)=>{
                return sum + Number(item.quantity) * Number(item.unitprice);
            },0);

            order.total = total.toFixed(2);
        }
    });

    this.on('submitOrder', async(req)=>{
        const {orderID} = req.data;

        const order = await cds.tx(req).run(
            SELECT.one
            .from('procurement.PurchaseOrders')
            .where({
                ID: orderID
            })
        )

        if(!order){
            return req.error(404, 'Purchase Order Not Found')
        }

        if(order.status !== "DRAFT"){
            return req.error(400, `Cannot submit an order with status '${order.status}'`)
        }

        const items = await cds.tx(req).run(
            SELECT.from('procurement.OrderItems')
            .columns('ID')
            .where({ order_ID: orderID })
        );

        if(items.length===0){
            return req.error(400,"Cannot submit a Purchase Order Without Items");
        }

        await cds.tx(req).run(
            UPDATE('procurement.PurchaseOrders')
            .set({status: 'SUBMITTED'})
            .where({
                ID : orderID
            })
        );
        return { message: 'Purchase Order Submitted Successfully'};
    });
});