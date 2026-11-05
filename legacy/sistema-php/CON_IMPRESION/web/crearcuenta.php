<!doctype html>

<?php
session_start(); 
$session_id= session_id();
include "db/core/autoload.php";
include "db/core/app/model/CategoriasData.php";
include "db/core/app/model/ProductoData.php";
include "db/core/app/model/CarritoData.php";

?>
<html lang="es"  class="default" >
<meta http-equiv="content-type" content="text/html;charset=utf-8" />
<head> 
  <meta charset="utf-8">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>Carrito</title>
  <meta name="description" content="">
  <meta name="keywords" content="">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/vnd.microsoft.icon" href="https://prestashopdemosite.com/theme/at_galvatron/demo/img/favicon.ico?1582011589">
  <link rel="shortcut icon" type="image/x-icon" href="https://prestashopdemosite.com/theme/at_galvatron/demo/img/favicon.ico?1582011589">
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
    <span class="title-cog">Cuenta</span>
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
              <li>
                <a class="signin leo-quicklogin" data-enable-sociallogin="enable"  href="javascript:void(0)" title="Iniciar sesión" >
                  <i class="material-icons">&#xE88D;</i><span>Iniciar sesión</span>
                </a>
              </li>
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
                                  <span class="menu-title">Inicio</span>
                            </a>
                        </li>
                         
                        
                          
                     
                        <li data-menu-type="controller" class="nav-item  " >
                            <a class="nav-link has-category" href="contacto.php" target="_self">
                                <span class="menu-title">Contacto</span>
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
      <p class="breadcrumb-page-name hidden-sm-down">Cart</p>
    <!--end page name-->
  <ol itemscope itemtype="">
    
              
          <li itemprop="itemListElement" itemscope itemtype="">
            <a itemprop="item" href="index.php">
              <span itemprop="name">Casa</span>
            </a>
            <meta itemprop="position" content="1">
          </li>
        
          
  </ol>
</nav>
<div class="row">
            

 <style type="text/css">
   #wrapper {
    margin: 8px 0;
}
 </style>           
<div id="content-wrapper" class="col-lg-12 col-xs-12 ">
    
<div  class="col-md-6 col-md-offset-3">
    <section id="main">
        <header class="page-header">
          <h1>Registrar una cuenta cuenta</h1>
          <p>El correo electrónico debe ser verdadero, se manejará como su usuario para ingresar nuevamente.</p>
        </header>
      <section id="content" class="page-content card card-block">
      <section class="login-form">
      <form id="login-form" action="addcliente.php" method="post">

      <section>
          
          <div class="form-group row ">
              <label class="col-md-3 form-control-label required"> Cédula</label>
              <div class="col-md-8">
                    <div class="input-group js-parent-focus">
                      <input class="form-control js-child-focus js-visible-password" name="documento" type="text" value="" required placeholder="Ejem: 909238823">
                    </div>
              </div>
          </div>

          <div class="form-group row ">
              <label class="col-md-3 form-control-label required"> Nombre y Apellido</label>
              <div class="col-md-8">
                    <div class="input-group js-parent-focus">
                      <input class="form-control js-child-focus js-visible-password" name="nombre" type="text" value="" required placeholder="Ejem. Juan Carlos Julian">
                    </div>
              </div>
          </div>

          <div class="form-group row ">
              <label class="col-md-3 form-control-label required"> Dirección</label>
              <div class="col-md-8">
                    <div class="input-group js-parent-focus">
                      <input class="form-control js-child-focus js-visible-password" name="direccion" type="text" value="" required placeholder="Dirección y referencia">
                    </div>
              </div>
          </div>

          

          <div class="form-group row ">
            <label class="col-md-3 form-control-label required"> Celular</label>
            <div class="col-md-8">
                  <input class="form-control" name="celular" type="text" value="" required placeholder="Ejem. 997878678">
            </div>
          </div>

          <div class="form-group row ">
            <label class="col-md-3 form-control-label required"> Email</label>
            <div class="col-md-8">
                  <input class="form-control" name="email" type="email" value="" required placeholder="prueba@gmail.com">
            </div>
          </div>

            <div class="form-group row ">
              <label class="col-md-3 form-control-label required"> Password</label>
              <div class="col-md-8">
                    <div class="input-group js-parent-focus">
                      <input class="form-control js-child-focus js-visible-password" name="password" type="password" value="" required placeholder="password">
                    </div>
              </div>
            </div>



          
    </section>

    
      <footer class="form-footer text-sm-center clearfix">
        <input type="hidden" name="submitLogin" value="1">
          <button id="submit-login" class="btn btn-primary" data-link-action="sign-in" type="submit" class="form-control-submit">
            Registrarse
          </button>
        
      </footer>
    

      </form>


      </section>
      <hr/>
      
        
      
      <div class="no-account">
        <a href="micuenta.php" data-link-action="display-register-form">
          ¿Ya tienes cuenta? Ingresa aquí
        </a>
      </div>
    

      </section>
    

  </section>

</div>



    
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