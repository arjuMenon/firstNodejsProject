var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')
const userHelper=require('../helpers/user-helpers');
const userHelpers = require('../helpers/user-helpers');
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }

}

/* GET home page. */
router.get('/', async function(req, res, next) {
  let user=req.session.user 
  console.log(user);
  let cartCount=null
  if(req.session.user){

  cartCount=await userHelper.getCartCount(req.session.user._id)}
  productHelper.getAllProducts().then((products)=>{
    

    res.render('user/view-products',{products,user,cartCount});
  })
  
  
});
router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else{

    res.render('user/login',{'loginErr':req.session.loginErr})
    req.session.loginErr=false
  }
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
  
})
router.post('/signup',(req,res)=>{
  userHelper.doSignup(req.body).then((response)=>{
    console.log(response);
    req.session.loggedIn=true
    req.session.user=response
    res.redirect('/')

  })

})
router.post('/login',(req,res)=>{
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else{
      req.session.loginErr="Invalid username and password"
      res.redirect('/login')
    }
  })


})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')

})
router.get('/cart',verifyLogin,async(req,res)=>{
let product=await userHelper.getCartProducts(req.session.user._id)
let totalValue=await userHelper.getTotalAmount(req.session.user._id )
console.log(product);
  res.render('user/cart',{product,user:req.session.user,totalValue})
})
router.get('/add-to-cart/:id',(req,res)=>{
  console.log('api call')
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })

})
router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body)
  userHelper.changeProductQuantity(req.body).then(async(response)=>{
     response.total=await userHelper.getTotalAmount(req.body.user)
    res.json(response)

  })
})
router.get('/place-order',verifyLogin,async(req,res)=>{
  let total=await userHelper.getTotalAmount(req.session.user._id)

  res.render('user/place-order',{total,user:req.session.user})
})
router.post('/place-order',async(req,res)=>{
  let product=await userHelper.getCartProductList(req.body.userId)
  let totalPrice=await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body,product,totalPrice).then((response)=>{
    res.json({status:true})

  })


  console.log(req.body)
})
router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})
router.get('/orders',async(req,res)=>{
  let orders=await userHelper.getUserOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})
})
router.get('/view-order-products/:id',async(req,res)=>{
  let product=await userHelper.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,product})
})


module.exports = router;
