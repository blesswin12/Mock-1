namespace procurement;

using { cuid, managed } from '@sap/cds/common';

entity Suppliers : cuid,managed {
    name: String(100) not null;
    email: String(255);
    active: Boolean default true;
}

entity Products : cuid,managed {
    name: String(100) not null;
    description: String(500);
    price : Decimal(10,2) not null;
    stock : Integer default 0;
    supplier : Association to Suppliers;
}

entity PurchaseOrders : cuid,managed {
    orderDate : Date;
    status    : String(20) default 'DRAFT';
    supplier : Association to Suppliers;
    Items : Composition of many OrderItems on Items.order = $self;
    virtual total : Decimal(10,2);
    }

entity OrderItems : cuid {
    order : Association to PurchaseOrders;
    Products : Association to Products;
    quantity : Integer not null default 1;
    unitprice : Decimal(10,2) not null;
}