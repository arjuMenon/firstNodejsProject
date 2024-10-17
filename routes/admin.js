var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')


/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelper.getAllProducts().then((products)=>{
    console.log(products)

    res.render('admin/view-products',{admin : true,products});
  })
 
  });
  router.get('/add-shop',function(req,res){
    res.render('admin/add-shop')

    
  })
  router.post('/add-shop',(req,res)=>{
    

    productHelper.addProduct(req.body,(id)=>{
      let image=req.files.image
      console.log(id)
      image.mv('./public/product-images/'+id+'.jpeg',(err,done)=>{
        if(!err){
          res.render('admin/add-shop')}
          else{
            console.log(err);
          }

        

      })
    })
  })
  const Handlebars = require('handlebars');

const template = Handlebars.compile('{{status}}');

// Set runtime options
const options = {
  allowProtoPropertiesByDefault: true,
  allowProtoMethodsByDefault: true
};

// Compile the template with the runtime options
const result = template('admin/add-shops', options);
console.log(result);

router.get("/delete-product/:id",(req,res)=>{
  let proId=req.params.id
  console.log(proId);
  productHelper.deleteProduct(proId).then((response)=>{
    res.redirect('/admin')
  })

})
router.get('/edit-product/:id',async(req,res)=>{
  let product=await productHelper.getProductDetails(req.params.id)
  console.log(product)
  res.render('admin/edit-product',{product})
})
router.post('/edit-product/:id',(req,res)=>{
  let id=req.params.id
  productHelper.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    
      

    })
  }) 



module.exports = router;
