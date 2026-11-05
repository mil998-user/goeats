<!doctype html>

<?php
session_start(); 
$session_id= session_id();
include "db/core/autoload.php";
include "db/core/app/model/CategoriasData.php";
include "db/core/app/model/ProductoData.php";
include "db/core/app/model/CarritoData.php";

include "db/core/app/model/ClientesData.php";
include "db/core/app/model/MesaData.php";
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
  .totalstyle{
        font-style: normal;
    font-weight: 700 !important;
    font-size: 24px;
    line-height: 23px;
    letter-spacing: .005em;
    color: #008ad9;
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

<?php if(isset($_GET['id_mesa']) and isset($_GET['id_mesa'])>0){ 

    $mesaselec=MesaData::getById($_GET['id_mesa']); 
    
  ?> 
<div id="leo_block_top" class="popup-over e-scale float-md-right">
    <a href="javascript:void(0)" data-toggle="dropdown" class="popup-title btn-setting">
      <i class="fa fa-tablet" aria-hidden="true"></i>
    <span class="title-cog">MESA  <?php echo $mesaselec->nro_mesa;?></span>
    </a>      
  
</div>

<?php }; ?> 


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
                  <div class="logo-header"><a href="productos_mesa.php?id_mesa=<?php echo $_GET['id_mesa']; ?>"><img class="logo img-fluid" src="img/logo.jpg" alt="At Galvatron"></a></div>

              </div>
              <div  class="col-xl-6 col-lg-9 col-md-4 col-sm-4 col-xs-4 col-sp-4  ApColumn ">
                 
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
                            <a class="nav-link has-category" href="productos_mesa.php?id_mesa=<?php echo $_GET['id_mesa']; ?>" target="_self">
                                  <span class="menu-title">Productos</span>
                            </a>
                        </li>
                        
                        
                    </ul>
</div>

</nav>
           
    
</div>

    </div>


<div class="col-xl-3 col-lg-3 col-md-4 col-sm-4 col-xs-4 col-sp-4  ApColumn ">
                   
<div id="_desktop_cart">
  <div class="blockcart cart-preview inactive" data-refresh-url="">
    <a href="carrito_mesa.php?id_mesa=<?php echo $_GET['id_mesa']; ?>">
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
      
  <?php if(isset($_GET['id_mesa']) and isset($_GET['id_mesa'])>0){ 

    $mesaselec=MesaData::getById($_GET['id_mesa']); 
    if(@count($mesaselec)>0 and $mesaselec->estado=='a'){
  ?>      
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
            

            
<div id="content-wrapper" class="col-lg-12 col-xs-12">
    
  <section id="main">
    <div class="cart-grid row"  id="resultados">

      <!-- Left Block: cart product informations & shpping -->
      <div class="cart-grid-body col-xs-12 col-lg-8">

        <!-- cart products detailed -->
        <div class="card cart-container">
          <div class="card-block">
            <h1 class="h1">Carrito de compras</h1>
          </div>
          <hr class="separator">
          
            
          <div class="cart-overview js-cart" data-refresh-url="">
          	<ul class="cart-items" >
          	<?php $tpms = CarritoData::getAllTemporal($session_id); 
	        $total=0;
	        if(@count($tpms)>0){
	          $total=0;
	          foreach($tpms as $tpm):?>
	          	
	          	 
	          	<li class="cart-item">
	          		<div class="product-line-grid row">
	          			<div class="product-line-grid-left col-md-3 col-xs-4">
	          				<span class="product-image media-middle">
	          					<img src="../sistema/assets/img/productos/<?php echo $tpm->getProducto()->imagen; ?>">
	          				</span>
	          			</div> 
	          			<div class="product-line-grid-body col-md-4 col-xs-8">
	          				<div class="product-line-info"><a href="" class="label">
	          					<?php echo $tpm->getProducto()->presentacion ;?></a></div>
	          				<div class="product-line-info product-price h5 has-discount">
	          					<div class="current-price"><span class="price">$ <?php echo $tpm->precio;?></span></div>
	          				</div>
	          			</div>
	          			
	          			 <!--  product left body: description -->
					  <div class="product-line-grid-right product-line-actions col-md-5 col-xs-12">
					    <div class="row">
					      <div class="col-xs-4 hidden-md-up"></div>
					      <div class="col-md-10 col-xs-6">
					        <div class="row">
		          				<div class="col-md-5 col-xs-6 col-sp-12 qty">
		                          <h4><?php echo $tpm->cantidad;?></h4>
		                      	</div>
						        <div class="col-md-7 col-xs-2 col-sp-12 price">
						            <span class="product-price">
						              <strong>$ <?php echo number_format($tpm->precio*$tpm->cantidad,2,'.',',');?> </strong>
						            </span>
						        </div>
        					</div>
      					  </div>
					      <div class="col-md-2 col-xs-2 text-xs-right">
					        <div class="cart-line-product-actions">
					        	<a href="#" onclick="eliminar('<?php echo $tpm->id; ?>')">
					        		<i class="fa fa-trash"></i> </a>
					        
					        </div>
					      </div>
					    </div>
					  </div>


	          		</div>
	          	</li>
	          	<?php
	              $total=($tpm->cantidad*$tpm->precio)+$total;
	          endforeach; 

	        }else{ $total=0; ?>

	        </ul>
            <span class="no-items">No hay más artículos en el carrito</span>
        	<?php }; ?>
          </div>
        </div> 
        <a class="label" href="productos_mesa.php?id_mesa=<?php echo $_GET['id_mesa']; ?>"><i class="material-icons">chevron_left</i>Seguir comprando</a>
      </div>

      <!-- Right Block: cart subtotal & cart total -->
      <div class="cart-grid-right col-xs-12 col-lg-4">
        <div class="card cart-summary">   

        <form method="post" action="addpedidomesa.php">       
          <div class="cart-detailed-totals">
            <div class="card-block">
              <div class="cart-summary-line" id="cart-subtotal-products">
                  <span class="label js-subtotal"> <?php echo $cantidad;?> artículos</span>
                  <span class="value"> $ <?php echo number_format($total,2,'.',',');?></span>
              </div>
              <div class="cart-summary-line" id="cart-subtotal-shipping">
                  <span class="label">Transporte</span>
                  <span class="value"> Gratis </span>
                  <div><small class="value"></small></div>
              </div>
            </div>
            <div class="card-block cart-summary-totals">
              <div class="cart-summary-line">
                <span class="label">Total IVA</span>
                <span class="value">$ 0</span>
              </div>
              <div class="cart-summary-line cart-total">
                <span class="label totalstyle" >Total </span>
                <span class="value totalstyle"> $ <?php echo number_format($total,2,'.',',');?></span>
              </div>

              
            </div>

            <div class="card-block cart-summary-totals">
              

              <div class="cart-summary-line cart-total">
                <input type="text" name="nombre" class="form-control" placeholder="Ingrese su nombre" style="border:1px solid #F44336 !important;" required="">

                <input type="hidden" name="id_mesa"  required="" value="<?php echo $_GET['id_mesa']; ?>">
              </div>
            </div>

</div>

         
  <div class="checkout text-sm-center card-block">
  <?php if($total<=0){?>
    <a style="background-color: #8b8b8b; border-color: #8b8b8b;color: white;" type="button" class="btn btn-outline" >Confirmar pedido</a>
  <?php }else{?> 

    <button type="submit" class="btn btn-outline" >Confirmar pedido</button>
  <?php }; ?>
  </div>

</form> 

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


    <?php }else{?>
      <div class="row">
      <div class="col-md-12">
      <div class="alert alert-danger" role="alert">
      NO PODEMOS MOSTRAR, "Mesa ocupada"
    </div>
    </div>
    </div>
    <?php }; ?>

  

<?php }else{ ?>
<div class="row">
      <div class="col-md-12">
      <div class="alert alert-danger" role="alert">
      ERROR
    </div>
    </div>
    </div>
<?php }; ?>

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
      
    
      function eliminar(id)
    {
      
      $.ajax({
        type: "GET",
        url: "del_tmp_mesa.php",
        data: "id="+id, 
     beforeSend: function(objeto){
      $("#resultados").html("Mensaje: Cargando...");
      },
        success: function(datos){
    $("#resultados").html(datos);
    }
      });

    }
    
  
</script>
</body>
</html>