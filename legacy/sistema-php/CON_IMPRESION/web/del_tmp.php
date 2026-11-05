    
<?php
session_start(); 
$session_id= session_id(); 

include "db/core/autoload.php";
include "db/core/app/model/CategoriasData.php";
include "db/core/app/model/ProductoData.php";
include "db/core/app/model/CarritoData.php";




if (isset($_GET['id']))//codigo elimina un elemento del array
{
	$del = CarritoData::getById($_GET["id"]);
	$del->del();
} 

?>

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
<!-- Left Block: cart product informations & shpping -->
      <div class="cart-grid-body col-xs-12 col-lg-8">

        <!-- cart products detailed -->
        <div class="card cart-container">
          <div class="card-block">
            <h1 class="h1">Carrito de compras</h1>
          </div>
          <hr class="separator">
          
            
          <div class="cart-overview js-cart" data-refresh-url="" >
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
	          					<?php echo $tpm->getProducto()->presentacion;?></a></div>
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
						              <strong>$ <?php echo number_format($tpm->precio*$tpm->cantidad,2,'.',',');?>  </strong>
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
        <a class="label" href="index.html"><i class="material-icons">chevron_left</i>Seguir comprando</a>
      </div>

      <!-- Right Block: cart subtotal & cart total -->
      <div class="cart-grid-right col-xs-12 col-lg-4">
        <div class="card cart-summary">           
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
                <span class="label">Total </span>
                <span class="value"> $ <?php echo number_format($total,2,'.',',');?></span>
              </div>
        
      
</div>
</div>
 
         
  <div class="checkout text-sm-center card-block">
    <a href="order.php" type="button" class="btn btn-outline" >Pasar por caja</a>
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