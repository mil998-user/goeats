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
                                  <span class="menu-title">Inicio</span>
                            </a>
                        </li>

                        <li data-menu-type="url" class="nav-item" >
                            <a class="nav-link has-category" href="productos.php" target="_self">
                                  <span class="menu-title">Productos</span>
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
                
            <nav data-depth="2" class="breadcrumb hidden-sm-down">
  <!--page name-->
      <p class="breadcrumb-page-name hidden-sm-down">Tu opinión vale mucho</p>
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

           
            
  <div id="left-column" class="col-xs-12 col-sm-12 col-md-4 col-lg-3">
    <div class="contact-rich">
  <h4>Información</h4>
  <div class="block">
    <div class="icon"><i class="material-icons">&#xE55F;</i></div>
    <div class="data">Dirección<br />Calle Costa Rica 187
Alma Rosa
Santo Domingo Este
11504</div>
  </div>
          <hr/>
    <div class="block">
      <div class="icon"><i class="material-icons">&#xE158;</i></div>
      <div class="data email">
        Email:<br/>
       <a href="mailto:rinconsuizo0744@gmail.com">rinconsuizo0744@gmail.com</a>
       </div>
    </div>

    <hr/>
    <div class="block">
      <div class="icon"><i class="material-icons">&#xE55F;</i></div>
      <div class="data">
        Horario:<br/>
       <a href="#">Lunes - Viernes <br> 7am -12pm</a>
       </div>
    </div>

  </div>

  </div>


  <div id="content-wrapper" class="left-column col-xs-12 col-sm-12 col-md-8 col-lg-9">
      <section id="main">
      <section id="content" class="page-content card card-block"> 
  <section class="contact-form">
  <form action="addcontacto.php" method="post" enctype="multipart/form-data">

    
    <section class="form-fields">
        <div class="form-group row">
          <div class="col-md-9 col-md-offset-3">
            <h3>Contacto</h3>
          </div>
        </div>

        <div class="form-group row">
          <label class="col-md-3 form-control-label">Asunto</label>
          <div class="col-md-6">
            <select name="asunto" class="form-control form-control-select">
              <option value="Preguntas">Preguntas</option>
              <option value="Sugerencia">Sugerencia</option>
            </select>
          </div>
        </div>

        <div class="form-group row">
          <label class="col-md-3 form-control-label">Nombres completos</label>
          <div class="col-md-6">
            <input class="form-control" name="nombre" type="nombre" value="" required>
          </div>
        </div>

        <div class="form-group row">
          <label class="col-md-3 form-control-label">Email address</label>
          <div class="col-md-6">
            <input class="form-control" name="email" type="email" value="" required>
          </div>
        </div>

        
         
        
        <div class="form-group row">
          <label class="col-md-3 form-control-label">Mensaje</label>
          <div class="col-md-9">
            <textarea class="form-control" name="mensaje" placeholder="Cómo podemos ayudarlo?" rows="3"></textarea>
          </div>
        </div>

        
        
      </section>

      <footer class="form-footer text-sm-right">
        
        <input class="btn btn-outline" type="submit" name="submitMessage" value="Enviar mensaje">
      </footer>
    
  </form>
</section>


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


<script src="css/jquery.js"></script>





  </body>


</html>