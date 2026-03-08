import mongoose from "mongoose";

const productSchema = mongoose.Schema(
{
  name:{
    type:String,
    required:true,
    trim:true
  },

  description:{
    type:String,
    required:true
  },

  price:{
    type:Number,
    required:true
  },

  discountPrice:{
    type:Number
  },

  countInStock:{
    type:Number,
    required:true,
    default:0
  },

  sku:{
    type:String,
    unique:true,
    required:true
  },

  /* MAIN CATEGORY (Men / Women / Kids / Beauty etc) */
  mainCategory:{
    type:String,
    required:true
  },

  /* SUB CATEGORY (Topwear / Bottomwear etc) */
  subCategory:{
    type:String
  },

  brand:{
    type:String
  },

  sizes:{
    type:[String],
    required:true
  },

  colors:{
    type:[String],
    required:true
  },

  collections:{
    type:String,
    required:true
  },

  material:{
    type:String
  },

  gender:{
    type:String,
    enum:["Men","Women","Unisex"]
  },

  images:[
  {
    url:{
      type:String,
      required:true
    },
    altText:String
  }
  ],

  isFeatured:{
    type:Boolean,
    default:false
  },

  isPublished:{
    type:Boolean,
    default:true
  },

  rating:{
    type:Number,
    default:0
  },

  numReviews:{
    type:Number,
    default:0
  },

  tags:[String],

  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  }

},
{timestamps:true}
);

const Product = mongoose.model("Product",productSchema);

export default Product;