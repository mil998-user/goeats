<!doctype html>

<?php
session_start(); 
$session_id= session_id();
include "db/core/autoload.php";
include "db/core/app/model/CategoriasData.php";
include "db/core/app/model/ProductoData.php";
include "db/core/app/model/CarritoData.php";

include "db/core/app/model/ClientesData.php";
?> 
<html lang="es"  class="default" >
<meta http-equiv="content-type" content="text/html;charset=utf-8" />
<head> 
  <meta charset="utf-8">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>Carrito</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="css/estilos.css" type="text/css" media="all">

<link rel="stylesheet" href="css/bos.css" type="text/css" media="all">
<script src="css/bos.js"  crossorigin="anonymous"></script>
<link rel="stylesheet" href="css/font-awesome.min.css">
<style type="text/css">
  .list-group-item {
    position: relative;
    display: block;
    padding: 0.19rem 1.25rem;
    margin-bottom: -1px;
    background-color: #fff;
    border: 1px solid #ddd;
}
.form-check {
    position: relative;
    display: block;
    margin-bottom: 0.25rem;
}
</style>
</head>

  <body id="cart" class="lang-es country-us currency-usd layout-full-width page-cart tax-display-disabled cart-empty fullwidth">
    <main id="page">     
      <header id="header">
        <div class="header-container">     
           <div class="header-banner">
            <div class="container">
              <div class="inner"></div>
          </div>
        </div>
  <nav class="header-nav">
    <div class="topnav">
        <div class="container">
          <div class="inner"></div>
        </div>
    </div>
    <div class="bottomnav" style="background-color: #c81a1f !important;">
        <div class="container">
        <div class="inner">
    <div id="form_7278891982233858" class="row dpnav2 ApRow  has-bg bg-fullwidth" data-src="" style="" data-bg_data=" no-repeat center center">
        
    <div class="col-xl-6 col-lg-6 col-md-6 col-sm-6 col-xs-6 col-sp-6 hidden-sm-down ApColumn ">
      
<div class="block ApHtml">
      <div class="block_content"><p class="text-freeship">¡Envio gratis en todas las ordenes!</p><div id="gtx-trans" style="position: absolute; left: -17px; top: -9px;"><div class="gtx-trans-icon"></div></div></div>
      </div>
    </div>
<div  class="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-xs-12 col-sp-12  ApColumn ">

<div class="block ApRawHtml">
    <a class="nav2-icon-phone" href="tel:+1 829-841-7721" title="+1 829-841-7721"><i class="icon-nqt-phone"></i><span>+1 829-841-7721</span></a>      
</div>

<div id="leo_block_top" class="popup-over e-scale float-md-right">
    <a href="javascript:void(0)" data-toggle="dropdown" class="popup-title btn-setting">
      <i class="icon-nqt-user-cog" aria-hidden="true"></i>
    <span class="title-cog"><?php if(isset($_SESSION["id_cliente"]) ){ echo ClientesData::getById($_SESSION["id_cliente"])->nombres;  }else{ echo "Cuenta";}?></span>
    </a>      
  <div class="popup-content">
    <div class="row">
      <div class="col-xs-6">
        <div class="language-selector">
          <span>Idioma:</span>
          <ul class="link">
              <li  class="current" >
                <a href="#" class="dropdown-item">
                  <img src="img/l/5.jpg" alt="Español" width="16" height="11" />
                </a>
              </li>
          </ul>
        </div>
        <div class="currency-selector">
          <span>Moneda:</span>
          <ul class="link">
              <li>
                <a title="Dop" rel="nofollow" href="#" class="dropdown-item">DOP</a>
              </li>
          </ul>
        </div>
      </div>
      <div class="col-xs-6">
          <div class="useinfo-selector">
            <ul class="user-info">

              <?php if(isset($_SESSION["id_cliente"]) ):?>  

              <li>
                <a class="signin leo-quicklogin" data-enable-sociallogin="enable"  href="javascript:void(0)" title="Hola" >
                  <i class="material-icons">&#xE88D;</i><span> Hola <?php if(isset($_SESSION["id_cliente"]) ){ echo ClientesData::getById($_SESSION["id_cliente"])->nombres;  }?></span>
                </a>
              </li>

              <li>
                <a class="signin leo-quicklogin" data-enable-sociallogin="enable"  href="salir.php" title="Salir de sesión" >
                  <i class="material-icons">&#xE88D;</i><span>Salir</span>
                </a>
              </li>
              
                      
              <?php else:?>
                <li>
                  <a class="signin leo-quicklogin" data-enable-sociallogin="enable"  href="micuenta.php" title="Iniciar sesión" >
                    <i class="material-icons">&#xE88D;</i><span>Iniciar sesión</span>
                  </a>
                </li>

              <?php endif;?>

              
              <li>
                <a class="myacount"  href="micuenta.php" title="Mi cuenta" rel="nofollow">
                  <i class="material-icons">&#xE8A6;</i> <span>Mi cuenta</span>
                </a>
              </li>
              
            
            </ul>
          </div>
        </div>
    </div>
  </div>
</div>


</div>           
</div>
</div>
</div>
</div>
</nav>



  <div class="header-top">
    <div class="container">
        <div class="inner">
          <div id="form_6256705932421997" class="row dptop ApRow  has-bg bg-fullwidth" style="" data-bg_data=" #fff no-repeat center center">
              <div class="col-xl-3 col-lg-12 col-md-4 col-sm-4 col-xs-4 col-sp-4  ApColumn " >
                  <div class="logo-header"><a href="index.php"><img class="logo img-fluid" src="img/logo.jpg" alt=""></a></div>

              </div>
              <div    class="col-xl-6 col-lg-9 col-md-4 col-sm-4 col-xs-4 col-sp-4  ApColumn ">
                 
              <div id="memgamenu-form_9770107693982036" class="ApMegamenu">
                <nav data-megamenu-id="9770107693982036" class="leo-megamenu cavas_menu navbar navbar-default enable-canvas " role="navigation">
                  <div class="navbar-header">
                    <button type="button" class="navbar-toggler hidden-lg-up" data-toggle="collapse" data-target=".megamenu-off-canvas-9770107693982036">
                        <span class="sr-only">Navegación de palanca</span>
                                            &#9776;                    
                    </button>
                  </div>
                  <div class="leo-top-menu collapse navbar-toggleable-md megamenu-off-canvas megamenu-off-canvas-9770107693982036">
                    <ul class="nav navbar-nav megamenu horizontal">

                        <li data-menu-type="url" class="nav-item" >
                            <a class="nav-link has-category" href="index.php" target="_self">
                                  <span class="menu-title">Productos</span>
                            </a>
                        </li>
                        
                         
                        
                          
                     
                       
                    </ul>
</div>

</nav>
           
    
</div>

    </div><!-- @file modules\appagebuilder\views\templates\hook\ApColumn -->


<div class="col-xl-3 col-lg-3 col-md-4 col-sm-4 col-xs-4 col-sp-4  ApColumn ">
                    <!-- @file modules\appagebuilder\views\templates\hook\ApModule -->
<div id="_desktop_cart">
  <div class="blockcart cart-preview inactive" data-refresh-url="">
    <a href="carrito.php">
    <div class="header btn-header btn-cart">
              <i class="icon-nqt-shopping-basket" aria-hidden="true"></i>
        <span class="cart-products-count"><?php echo @count(CarritoData::getAllTemporal($session_id));?></span>
          </div>
   
     <?php $tpms = CarritoData::getAllTemporal($session_id); 
        $total=0;
        $cantidad=0;
        if(@count($tpms)>0){
          $total=0;
          foreach($tpms as $tpm):
              $total=($tpm->cantidad*$tpm->precio)+$total;
              $cantidad=$tpm->cantidad+$cantidad;
          endforeach; 
        }else{ $total=0; };?>

    <span class="cart-count-items">$ <?php echo $total;?></span>
  </a>
  </div>
  
</div>


</div>            
</div>
</div>
</div>
 </div>
  
          
  </div>
</header>
      
        
<aside id="notifications">
  <div class="container">
    
    
    
      </div>
</aside>
      
      <section id="wrapper">
       
              <div class="container">
                
            <nav data-depth="2" class="breadcrumb hidden-sm-down">
  <!--page name-->
      <p class="breadcrumb-page-name hidden-sm-down">Menú</p>
    <!--end page name-->
  <ol itemscope itemtype="">
    
              
          
        
              
          <li itemprop="itemListElement" itemscope itemtype="">
            <a itemprop="item" href="#">
              <span itemprop="name"></span>
            </a>
            <meta itemprop="position" content="2">
          </li>
        
          
  </ol>
</nav>
          
          <div class="row">
            
              <div id="left-column" class="sidebar col-xs-12 col-sm-12 col-md-4 col-lg-3">
                                  

<div class="block-categories block block-highlighted hidden-sm-down">
  <h4 class="title_block"><a href="#">CATEGORÍAS</a></h4>
  <div class="block_content">
    <ul class="category-top-menu">
      <li>
        <ul class="category-sub-menu">
          
          <?php $categorias = CategoriasData::getAll();
            if(@count($categorias)>0){ ?>  
            <?php foreach($categorias as $categoria):?>

              <li data-depth="0" <?php if(isset($_GET['id']) and $categoria->id_catg==$_GET['id']){?> style="background-color: #009688;padding-left: 10px;" <?php }; ?> >
                <a href="productos.php?id=<?php echo $categoria->id_catg; ?>"  <?php if(isset($_GET['id']) and $categoria->id_catg==$_GET['id']){?> style="color: white;" <?php }; ?>  ><?php echo $categoria->descripcion; ?></a>
                <div class="navbar-toggler collapse-icons"><i class="fa fa-caret-right add"></i>
                </div>
              </li>

            <?php endforeach; ?>
            <?php }else{  echo"<h4 class='alert alert-success'>NO HAY REGISTRO</h4>"; }; ?>
        </ul>
  </div>
</div>


</div>
            

            
   <div id="content-wrapper" class="left-column col-xs-12 col-sm-12 col-md-8 col-lg-9">
    
    
  <section id="main">

    
  <div id="js-product-list-header">
            <div class="block-category card card-block">
            <h1 class="h1">Inicio</h1>
            <div class="block-category-inner">
                                            </div>
        </div>
    </div>
  

    <section id="products">
     
        


 <div>
          
            
<div id="js-product-list-top" class="products-selection">
  <div class="row">
    <div class="col-lg-6 col-md-3 hidden-sm-down total-products">     
      
        <div class="display">
          <div id="grid" class="leo_grid selected"><a rel="nofollow" href="#" title="Cuadrícula"><i class="fa fa-th"></i></a></div>
          <div id="list" class="leo_list "><a rel="nofollow" href="#" title="Lista"><i class="fa fa-list-ul"></i></a></div>
        </div>
      
      <p>Selecciona productos a pedir...</p>
    </div>
    <div class="col-lg-6 col-md-9">


<form method="get" action="index.php">  
<input type="hidden" name="">   
<div class="row sort-by-row">
        
 <span class="col-sm-3 col-md-3 hidden-sm-down sort-by">Ordenar por:</span>
<div class="col-md-12 products-sort-order dropdown">

  <select class="form-control" name="id">
    <option value="">--- Selecciona ---</option>
    <?php $categorias = CategoriasData::getAll();
            if(@count($categorias)>0){ ?>  
            <?php foreach($categorias as $categoria):?>

              <option value="<?php echo $categoria->id_catg; ?>" <?php if(isset($_GET['id']) and $categoria->id_catg==$_GET['id']){ echo "selected";}?> ><?php echo $categoria->descripcion; ?></option>


            <?php endforeach; ?>
            <?php }else{  echo"<h4 class='alert alert-success'>NO HAY REGISTRO</h4>"; }; ?>
    
  </select>
  
  
        

          <div class="col-sm-12 col-xs-12 col-sp-12 hidden-md-up filter-button">
            <button type="submit" class="btn btn-outline" style="width: 100%;">
              Filtrar
            </button>
          </div>
              </div>
    </div>


    </form> 

    <div class="col-sm-12 hidden-md-up text-sm-center showing">
      Agregue productos a su carrito...
    </div>
  </div>
</div>
          
        </div>

        
          <div id="" class="hidden-sm-down">
            <section id="js-active-search-filters" class="hide">
  
    <h1 class="h6 hidden-xs-up">Filtros activos</h1>
  

  </section>

          </div>

        






<div  class="product_list grid  product-default ">
    <div class="row">
                    
             
     <?php 
      if(isset($_GET['id']) and $_GET['id']){
        $productos = ProductoData::getBycategoria($_GET['id']);
      }else{
        $productos = ProductoData::getAll();
      }
     
        if(@count($productos)>0){ ?>  
        <?php foreach($productos as $productoc):?>
          <div class="ajax_block_product col-sp-12 col-xs-6 col-sm-6 col-md-6 col-lg-4 col-xl-4 last-item-of-tablet-line last-item-of-mobile-line ">    
                  <article class="product-miniature js-product-miniature" data-id-product="1" data-id-product-attribute="0" itemscope itemtype="">
                    <div class="thumbnail-container">
                      <div class="product-image">
                         <a href="" class="thumbnail product-thumbnail">
                         <img class="img-fluid" src="../sistema/assets/img/productos/<?php echo $productoc->imagen; ?>" alt = "" data-full-size-image-url = "img/platos/pina1.jpg">
                         <span class="product-additional" data-idproduct="1"></span>
                         </a>
                          <span class="discount-percentage">$ 
                            <?php echo number_format($productoc->precio,2,'.',',');?>   
                          </span>
                      </div>
                      <div class="product-meta">
                        <h3 class="h3 product-title" itemprop="name"><a href=""><?php echo $productoc->presentacion;?></a></h3>
                       
            
                     <div class="leo-list-product-reviews" itemprop="aggregateRating" itemscope itemtype="">
                        <div class="leo-list-product-reviews-wraper">
                           <div class="star_content clearfix">
                              <div class="star star_on"></div>
                              <div class="star star_on"></div>
                              <div class="star star_on"></div>
                              <div class="star star_on"></div>
                              <div class="star"></div>
                              <meta itemprop="worstRating" content = "0" />
                              <meta itemprop="ratingValue" content = "4" />
                              <meta itemprop="bestRating" content = "5" />
                           </div>
                            <span class="nb-revews"><span itemprop="reviewCount">1</span> Comentario (s)</span>
                        </div>
                    </div>


          <div class="meta-button">
            <div class="button-container cart">
                <input type="hidden" class="form-control"    value="1" min="1" >
                <input type="hidden" class="form-control" id="precio_venta_<?php echo $productoc->id_pres; ?>"  value="<?php echo $productoc->precio;?>" >

                  <a class="btn btn-product add-to-cart leo-bt-cart leo-bt-cart_1"  href="#"  data-bs-toggle="modal" data-bs-target="#exampleModal<?php echo $productoc->id_pres; ?>">
                    <i class="icon-nqt-shopping-basket"></i>
                    <span class="name-btn-product">Agregar a carrito</span>
                  </span>
                  </a>
             
            </div>

           
            
            <!-- Modal -->
            <div class="modal fade" id="exampleModal<?php echo $productoc->id_pres; ?>" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
              <div class="modal-dialog modal-xl">
                <div class="modal-content">
                  <div class="modal-header" style="background: #4cbb6c;">
                    <h4 class="modal-title" id="exampleModalLabel" style="color: white;"> <i class="fa fa-plus"></i> Añadir a la lista de pedidos</h4>
                    <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close"><i class="fa fa-close"></i></button>
                  </div>

                  <div class="modal-body">
                    <div class="row">
                      <div class="col-md-5">
                        <div class="row">
                          <div class="col-md-10">
                            <img src="../sistema/assets/img/productos/<?php echo $productoc->imagen; ?>" class="product-image" style="width: 100%;">
                          </div>
                          
                        </div>
                      </div>

                      <div class="col-md-7" style="border-left: solid 1px #bcbcbc;">
                        <div class="cart-content">
                          <p class="cart-products-count" style="text-align: left;">Hay <?php echo @count(CarritoData::getAllTemporal($session_id));?> artículos en su carrito.</p>

                          <div class="col-md-12" style="text-align: left;">
                            <h6 class="h6 product-name" style="color: #f79a34; font-size: 1.125rem;margin-bottom: 0.625rem;"><?php echo $productoc->presentacion;?></h6>
                            <p class="product-price" style="color: #142332;text-align: left;font-size: 24px;font-weight: 600;">Precio unitario: $ <?php echo number_format($productoc->precio,2,'.',',');?></p>
                           
                          </div>

                          


                          <div class="col-md-4">
                            <div class="form-group">
                              <label for="formGroupExampleInput">Cantidad</label>
                              <input type="number" class="form-control" value="1" id="cantidad_<?php echo $productoc->id_pres; ?>" placeholder="1">
                            </div>

                            <ul class="list-group">
                              
                              
                              <li class="list-group-item active" style="text-align: left;">Opciones</li>
                              <?php $stringSeparado = explode(',', $productoc->opciones); 
                              if(count($stringSeparado)>0){

                              
                              for ($x=0;$x<count($stringSeparado); $x++){ ?>

                                <li class="list-group-item" style="text-align: left;">
                                <div class="form-check">
                                  <input style="left: 10px;" class="form-check-input" type="checkbox" value="<?php echo $stringSeparado[$x]; ?>" name="opciones[]">
                                  <label class="form-check-label" for="defaultCheck1">
                                    <?php echo $stringSeparado[$x]; ?>
                                  </label>
                                </div>
                              </li>

                              <?php }; } ?>

                            </ul>
                          </div>

                          
                        </div>

                      </div>


                      <div class="col-md-12" style="border-left: solid 1px #bcbcbc;">
                        <div class="cart-content">
                          
                          <div class="" style="float: right;">
                            <a href="#" class="btn btn-secondary" data-bs-dismiss="modal" onclick="agregar('<?php echo $productoc->id_pres; ?>')" >ADD CARRITO</a>
                            <a  href="carrito.php" type="button" class="btn btn-primary" style="background-color: #FF9800;">PASAR POR LA CAJA</a>
                          </div>
                        </div>

                      </div>





                    </div>
                  </div>
                 
                </div>
              </div>
            </div>


            <!-- Modal -->
            <div class="modal fade" id="imagen<?php echo $productoc->id_pres; ?>" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header" style="background: #4cbb6c;">
                   
                    <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close"><i class="fa fa-close"></i></button>
                  </div>

                  <div class="modal-body">
                    <div class="row">
                      <div class="col-md-12">
                        <div class="row">
                          <div class="col-md-12">
                            <img src="../sistema/assets/img/productos/<?php echo $productoc->imagen; ?>" class="product-image" style="width: 100%;">
                          </div>
                          
                        </div>
                      </div>


                    </div>
                  </div>
                 
                </div>
              </div>
            </div>





          <div class="quickview no-variants hidden-sm-down">

            <a href="#" data-bs-toggle="modal" data-bs-target="#imagen<?php echo $productoc->id_pres; ?>" class="quick-view btn-product" data-link-action="quickview" title="Vista rápida">
              <span class="leo-quickview-bt-loading cssload-speeding-wheel"></span>
              <span class="leo-quickview-bt-content">
                <i class="icon-nqt-eye"></i>
                <span class="name-btn-product">Vista rápida</span>
              </span>
            </a>

          </div>
          </div>

          </div>
          </div>
          </article>

          </div>

        <?php endforeach; ?>
    <?php }else{  echo"<h4 class='alert alert-success'>NO HAY REGISTRO</h4>"; }; ?>        
                                       
     




                    

</div>
</div>
  
</div>

  
  

  <div class="hidden-md-up text-xs-right up">
    <a href="#header" class="btn btn-secondary">
      Volver arriba
      <i class="material-icons">&#xE316;</i>
    </a>
  </div>
</div>
          
</div>

<div id="js-product-list-bottom">
  <div id="js-product-list-bottom"></div>
</div>

</section>

</section>

    
  </div>


            
 </div>
</div>
          
</section>



<footer id="footer" class="footer-container">
            
  <div class="footer-top">
    <div class="container">
    <div class="inner"></div>
    </div>
  </div>


  <div class="footer-center">
      <div class="container">
        <div class="inner">
          <div class="row box-service ApRow  has-bg bg-boxed" style="background: no-repeat;" data-bg_data=" no-repeat">
            
            <div  class="col-xl-4 col-lg-4 col-md-4 col-sm-12 col-xs-12 col-sp-12  ApColumn ">
              <div  class="block ApHtml">
                 <div class="block_content"><div></div></div>
              </div>
            </div>
          <div class="col-xl-4 col-lg-4 col-md-4 col-sm-12 col-xs-12 col-sp-12  ApColumn ">
            <div class="block ApHtml">
               <div class="block_content">
                <div class="icon-nqt-badge-dollar"></div>
                <div class="service-text">
                  <h3>Devoluciones gratis</h3>
                  <p>Política de devoluciones sin problemas y garantía de devolución del 100% del dinero. 
                  <span class="text-bold">Más sobre devoluciones</span></p>
                </div>
              </div>
            </div>
          </div>
          <div  class="col-xl-4 col-lg-4 col-md-4 col-sm-12 col-xs-12 col-sp-12  ApColumn ">
             <div  class="block ApHtml">
               <div class="block_content"><div></div></div>
             </div>
          </div>
        </div>

<div class="wrapper">
  <div class="containet">
    <div class="row copyright box-padding ApRow  has-bg bg-boxed" style="background: no-repeat;" data-bg_data=" no-repeat">
      <div class="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-xs-12 col-sp-12  ApColumn ">
        <div id="image-form_9629377904050320" class="block ApImage">
           <img src="img/pay-image.png" class="" title="" alt="" style=" width:auto; height:auto" />

              <div class='image_description'>
                 <p>Copyright © 2023 <span>Pedidos Online</span>. Todos los derechos reservados</p>            
              </div>
        </div>
    </div>            
  </div>
</div>
</div>


</div>
</div>
 </div>


  <div class="footer-bottom">
          <div class="container">
          <div class="inner"></div>
          </div>
  </div>
        
</footer>

</main>


<link href="//cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/css/toastr.min.css" rel="stylesheet" />
    
   
<script src="//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js" ></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/js/toastr.min.js"></script>
  

<script type="text/javascript">
  $toastr.options = {
        "closeButton": true,
        "debug": false,
        "progressBar": true,
        "preventDuplicates": false,
        "positionClass": "toast-bottom-left",
        "onclick": null,
        "showDuration": "400",
        "hideDuration": "1000",
        "timeOut": "7000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };

     function agregar(id)
    {
     
      var precio_venta=$('#precio_venta_'+id).val();
      var cantidad=$('#cantidad_'+id).val();
      //Inicia validacion
      if (isNaN(cantidad)) 
      {
      alert('Esto no es un numero');
      document.getElementById('cantidad_'+id).focus();
      return false;
      }
      if (isNaN(precio_venta))
      { 
      alert('Esto no es un numero ');
      document.getElementById('precio_venta_'+id).focus();
      return false;
      }

      var opciones = JSON.stringify($('[name="opciones[]"]').serializeArray());
      
      //Fin validacion
    var parametros={"id":id,"precio_venta":precio_venta,"cantidad":cantidad,"opciones":opciones}; 
    $.ajax({
        type: "POST",
        url: "agregar_tmp.php", 
        data: parametros,
     beforeSend: function(objeto){
      $("#_desktop_cart").html("Mensaje: Cargando...");
      },success: function(datos){

        $("#_desktop_cart").html(datos);
        toastr.success('El plato fue agregado al carrito con éxito!');
        

    }
      });
    }




</script>



<script src="css/jquery.js"></script>
<script type="text/javascript">
     

 
    
      
    
    
  
</script>








  </body>


</html>