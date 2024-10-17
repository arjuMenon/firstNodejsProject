var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { response } = require('../app')
var objectId=require('mongodb').ObjectId
 
module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_collection).insertOne(userData).then((data)=>{

                resolve(data.ops[0])
            })

        }) 


    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_collection).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log("Login success")
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        console.log('Login failed')
                        resolve({status:false})
                    }

                })
            }else{
                console.log('Login failed')
                resolve({status:false})
            }

        })
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:objectId(proId),
            quantity:1
             
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_collection).findOne({user:objectId(userId)})
            if(userCart){
                let proExist=userCart.product.findIndex(product=> product.item==proId)
                console.log(proExist);
                if(proExist!=-1){
                    db.get().collection(collection.CART_collection).updateOne({user:objectId(userId),'product.item':objectId(proId)},
                    {
                        $inc:{'product.$.quantity':1}
                    }
                ).then(()=>{
                    resolve()
                })
                }else{
                db.get().collection(collection.CART_collection).updateOne({user:objectId(userId)},
            {
                
                    $push:{product:proObj}
                
            }
        ).then((response)=>{
            resolve()
        })
    }

            }else{
                let cartObj={
                    user:objectId(userId),
                    product:[proObj]
                }
                db.get().collection(collection.CART_collection).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_collection).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$product'

                },
                {
                    $project:{
                        item:'$product.item',
                        quantity:'$product.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_collection,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'

                    }

                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                }
               
            ]).toArray()
            console.log(cartItems[0].product)
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
       return new Promise(async(resolve,reject)=>{
        let count=0
        let cart =await db.get().collection(collection.CART_collection).findOne({user:objectId(userId)})
        if(cart){
            count=cart.product.length
        }
        resolve(count)

       }) 
    },
    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)

        return new promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
            db.get().collection(collection.CART_collection).updateOne({_id:objectId(details.cart),'product.item':objectId(details.cart)},
            {
                $pull:{product:{item:objectId(details.product)}}
            }
        ).then((response)=>{
            resolve({removeProduct:true})
        })
    }else{
        db.get().collection(collection.CART_collection).updateOne({_id:objectId(details.cart),'product.item':objectId(details.product)},
    {
        $inc:{'product.$.quantity':details.count}
    }).then((response)=>{
        resolve({status:true})

    })
    }
        
        })
    },
    
        getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total=await db.get().collection(collection.CART_collection).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$product'

                },
                {
                    $project:{
                        item:'$product.item',
                        quantity:'$product.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_collection,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'

                    }

                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{ 
                        _id:null, 
                        total:{ $sum: { $multiply: [ '$quantity',{ $toInt:'$product.Price' } ] } } 
                    }
                    }
                
               
            ]).toArray()
            console.log(total[0].total)
            resolve(total[0].total)
        })

    },
    placeOrder:(order,product,total)=>{
        return new Promise((resolve,reject)=>{
            console.log(order,product,total);
            let status=order['payment-method']==='COD'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode
                },
                userId:objectId(order.userId),
                paymentMethod:order['payment-method'],
                product:product,
                totalAmount:total,
                date:new Date(),
                status:status
            }
            db.get().collection(collection.ORDER_collection).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_collection).removeOne({user:objectId(order.userId)})
                resolve()
            })


        })

    },
    getCartProductList:(userId)=>{
        return new Promise (async(resolve,reject)=>{
            let cart =await db.get().collection(collection.CART_collection).findOne({user:objectId(userId)})
            console.log(cart)
            resolve(cart.product)
        })
    },
    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(userId);
            let orders=await db.get().collection(collection.ORDER_collection).find({userId:objectId(userId)}).toArray()
            console.log(orders);
            resolve(orders)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems=await db.get().collection(collection.ORDER_collection).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$product'

                },
                {
                    $project:{
                        item:'$product.item',
                        quantity:'$product.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_collection,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'

                    }

                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                }
               
            ]).toArray()
            console.log(orderItems)
            resolve(orderItems)
        })
    }
     
    
 }  