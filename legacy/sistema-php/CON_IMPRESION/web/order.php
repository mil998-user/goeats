<!doctype html>

<?php
session_start(); 
$session_id= session_id();

date_default_timezone_set('America/Lima');
$hoy = date("Y-m-d");
$hora = date("H:i:s");
$fecha_completo = date("Y-m-d H:i:s");   

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
                  <div class="logo-header"><a href="index.php"><img class="logo img-fluid" src="img/logo.jpg" alt="At Galvatron"></a></div>

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
                
            <nav data-depth="1" class="breadcrumb hidden-sm-down">
  <!--page name-->
      <p class="breadcrumb-page-name hidden-sm-down">Order</p>
    <!--end page name-->
  <ol itemscope itemtype="">
    
              
          <li itemprop="itemListElement" itemscope itemtype="">
            <a itemprop="item" href="index.php">
              <span itemprop="name">Order</span>
            </a>
            <meta itemprop="position" content="1">
          </li>
        
          
  </ol>
</nav>





<aside id="notifications">
  <div class="container">
    
    
    
      </div>
</aside>
    


<div class="row">
            

 <style type="text/css">
   #wrapper {
    margin: 8px 0;
}
 </style>   




 <div id="content-wrapper" class="col-lg-12 col-xs-12">
    
  <section id="main">
    <div class="cart-grid row"  id="resultados">

      <!-- Left Block: cart product informations & shpping -->
      <div class="cart-grid-body col-xs-12 col-lg-8">

        <!-- cart products detailed -->
        <div class="card cart-container">
          <div class="card-block">
            <h1 class="h1">Información del personal</h1>
          </div>
          <hr class="separator">
          
          


          <div class="cart-overview js-cart" data-refresh-url="">
 


            <?php if(isset($_SESSION["id_cliente"]) ):?>  

        <h4 style="background-color: #f79a34; padding: 10px 10px;border-radius: 30px; color: white;">HOLA, 
        <?php if(isset($_SESSION["id_cliente"]) ){ echo ClientesData::getById($_SESSION["id_cliente"])->nombres;  }?>
        </h4> 
        <?php $cliente = ClientesData::getById($_SESSION["id_cliente"]);?>

            <section class="login-form">
              <p>La dirección seleccionada se utilizará tanto como su dirección personal (para la factura) como su dirección de entrega.</p>
      <form id="login-form" action="addventa.php" method="post">

      <section>
          
          <div class="form-group row ">
            <label class="col-md-3 form-control-label required"> <b> Cédula</b></label>
            <div class="col-md-9">
                  <input class="form-control" name="nombre" type="text" value="<?php echo $cliente->dni;?>" required style="border: 1px solid #d0d0d0;">
            </div>
          </div>

          <div class="form-group row ">
            <label class="col-md-3 form-control-label required"> <b> Nombre y Apellido</b></label>
            <div class="col-md-9">
                  <input class="form-control" name="nombre" type="text" value="<?php echo $cliente->nombres;?>" required style="border: 1px solid #d0d0d0;">
            </div>
          </div>

          <div class="form-group row ">
            <label class="col-md-3 form-control-label required"><b>Direción</b> (Considere todos los detalles y una referencia)</label>
            <div class="col-md-9">
                  <input class="form-control" name="direccion" type="text" value="<?php echo $cliente->direccion;?>" required style="border: 1px solid #d0d0d0;">
            </div>
          </div>

          <div class="form-group row ">
            <label class="col-md-3 form-control-label required"><b> Email</b></label>
            <div class="col-md-9">
                  <input class="form-control" name="email" type="email" value="<?php echo $cliente->correo;?>" required style="border: 1px solid #d0d0d0;">
            </div>
          </div>

          <div class="form-group row ">
            <label class="col-md-3 form-control-label required"><b> Celular</b></label>
            <div class="col-md-9">
                  <input class="form-control" name="celular" type="text" value="<?php echo $cliente->telefono;?>" required style="border: 1px solid #d0d0d0;">
            </div>
          </div>

          <div class="form-group row ">
            <label class="col-md-3 form-control-label required"><b> Va pagar con</b></label>
            <div class="col-md-9">
                  <select class="form-control" name="tipopago" style="padding: 1px 11px;border: 1px solid #d0d0d0;">
                    <option value="1">Efectivo</option>
                    <option value="2">Tarjeta</option>
                    <option value="3">Depósito</option>
                    <option value="4">Por Aplicación</option>
                  </select>
            </div>
          </div>

          

          
    </section>

    
      <footer class="form-footer text-sm-center clearfix">

          <input type="hidden" name="subtotalivanove" value="<?php echo $total;?>">
          <input type="hidden" name="fechaventa" value="<?php echo $fecha_completo;?>">


          <button id="submit-login" class="btn btn-primary" data-link-action="sign-in" type="submit" class="form-control-submit">
            Procesar y hacer pedido
          </button>
        
      </footer>
    

      </form>


      </section>


      <?php else:?>
         
              <header class="page-header">
                <h1>Ingrese a su cuenta</h1>
              </header>
            
            <form id="login-form" action="procesarlogin.php" method="post">

            <section>
                <input type="hidden" name="back" value="my-account">     
                <div class="form-group row ">
                  <label class="col-md-3 form-control-label required"> Email</label>
                  <div class="col-md-6">
                        <input class="form-control" name="email" type="email" value="" required>
                  </div>
                </div>

                  <div class="form-group row ">
                    <label class="col-md-3 form-control-label required"> Password</label>
                    <div class="col-md-6">
                          <div class="input-group js-parent-focus">
                            <input class="form-control js-child-focus js-visible-password" name="password" type="password" value="" required>
                          </div>
                    </div>
                  </div>

                
          </section>

          
            <footer class="form-footer text-sm-center clearfix">
              <input type="hidden" name="submitLogin" value="1">
                <button id="submit-login" class="btn btn-primary" data-link-action="sign-in" type="submit" class="form-control-submit" name="checkout">
                  Ingresar
                </button>
              
            </footer>
          

            </form>


            
              <hr>
            
            <div class="no-account">
              <a href="crearcuenta.php" data-link-action="display-register-form">
                ¿Sin cuenta? Crea uno aquí
              </a>
            </div>
          

         
          

      
      <?php endif;?>

          
          </div>
        </div>
        <a class="label" href="productos.php"><i class="material-icons">chevron_left</i>Seguir comprando</a>
      </div>

      <!-- Right Block: cart subtotal & cart total -->
      <div class="cart-grid-right col-xs-12 col-lg-4">
        <div class="card cart-summary">           
          <div class="cart-detailed-totals">
            <div class="card-block">
              <div class="cart-summary-line" id="cart-subtotal-products">
                  <span class="label js-subtotal"> <?php echo $cantidad;?> artículos</span>
                  <span class="value"> $<?php echo $total;?></span>
              </div>
              <div class="cart-summary-line" id="cart-subtotal-shipping">
                  <span class="label">Transporte</span>
                  <span class="value"> Gratis </span>
                  <div><small class="value"></small></div>
              </div>
            </div>
            <div class="card-block cart-summary-totals">
              <div class="cart-summary-line">
                <span class="label">Total ITBIS</span>
                <span class="value">$ 0</span>
              </div>
              <div class="cart-summary-line cart-total">
                <span class="label">Total </span>
                <span class="value"> $<?php echo $total;?></span>
              </div>
        
      
</div>
</div>

         
  


</div>
        

        
<div id="block-reassurance">
    <ul>
        <li>
          <div class="block-reassurance-item">
            <img src="img/icon3.png" alt="Política de seguridad">
            <span class="h6">Política de seguridad</span>
          </div>
        </li>
              <li>
          <div class="block-reassurance-item">
            <img src="img/icon1.png" alt="Política de entrega">
            <span class="h6">Política de entrega</span>
          </div>
        </li>
              <li>
          <div class="block-reassurance-item">
            <img src="img/icon2.png" alt="Política de devoluciones">
            <span class="h6">Política de devoluciones</span>
          </div>
        </li>
          </ul>
  </div>

        

      </div>

    </div>
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

  <script src="css/jquery.js"></script>  
<script type="text/javascript">
      
    
    
  
</script>
</body>
</html>