<!DOCTYPE html>
<?php 

   $full_name  = strip_tags($cliente->nomcliente);
   $email      = strip_tags($cliente->emailcliente);
   $subject    = "Orden confirmada";

?>
<html lang="es">
    <head>
        <title>Comprobante</title>  
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    </head>
    <body>
   <div style="border: 1px solid #6c91b2;border-radius: 10px; padding: 10px;">


     <table width='100%' bgcolor='white' cellpadding='0' cellspacing='0' border='0'>
     
     <tr><td>

     <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' style='max-width:650px; background-color:white; font-family:Verdana, Geneva, sans-serif;'>
      
  
        <tr height='80'>
         <th colspan='4' style='background-color:white; border-bottom:solid 0px #bdbdbd; font-family:Verdana, Geneva, sans-serif; color:#333; font-size:34px;' >
         <h4>RESTAURANTE EL RINCON SUIZO</h4>

        
          <p style='font-size: 16px;font-family: Verdana, Geneva, sans-serif;background-color: #333f50;color: white;text-align: center; font-weight: 200;padding: 15px;border-radius: 10px;'> <?php echo $full_name; ?></p>
         </th>
        </tr>
    
          

          <?php
          $total=0;
          $tmps = CarritoData::getAllTemporal($session_id);
          foreach($tmps as $p): 
            $total= ($p->precio*$p->cantidad)+$total;
            ?>
            <tr align='center' height='50' style='font-family:Verdana, Geneva, sans-serif;' style="width: 100%;">
           <td colspan='2' style='width: 30%'><p style='font-size: 14px;font-family: Verdana, Geneva, sans-serif;background-color: #547386;color: white;text-align: center; font-weight: 200;padding: 5px;border-radius: 5px;'> <?php echo $p->getProducto()->producto; ?></p></td>
           <td  colspan='2' style='width: 30%' ><p style='font-size: 14px;font-family: Verdana, Geneva, sans-serif;background-color: white;color: #7d8181;text-align: center; font-weight: 200;padding: 5px;border-radius: 5px;border: 1px solid #547386;margin-left: 3px;'> <?php echo $p->getProducto()->precioventa; ?></p></td>
            <td  colspan='2' style='width: 20%' ><p style='font-size: 14px;font-family: Verdana, Geneva, sans-serif;background-color: white;color: #7d8181;text-align: center; font-weight: 200;padding: 5px;border-radius: 5px;border: 1px solid #547386;margin-left: 3px;'> <?php echo $p->cantidad; ?></p></td>
             <td  colspan='2' style='width: 20%' ><p style='font-size: 14px;font-family: Verdana, Geneva, sans-serif;background-color: white;color: #7d8181;text-align: center; font-weight: 200;padding: 5px;border-radius: 5px;border: 1px solid #547386;margin-left: 3px;'> <?php echo $p->getProducto()->precioventa*$p->cantidad; ?></p></td>
          </tr>

           <?php  endforeach; ?>

           <tr align='center' height='50' style='font-family:Verdana, Geneva, sans-serif;' style="width: 100%;">
           <td colspan='2' style='width: 30%'><p style='font-size: 14px;font-family: Verdana, Geneva, sans-serif;background-color: #547386;color: white;text-align: center; font-weight: 200;padding: 5px;border-radius: 5px;'> TOTAL: </p></td>
           <td  colspan='2' style='width: 70%' ><p style='font-size: 14px;font-family: Verdana, Geneva, sans-serif;background-color: white;color: #7d8181;text-align: center; font-weight: 200;padding: 5px;border-radius: 5px;border: 1px solid #547386;margin-left: 3px;'> <?php echo $total; ?></p></td>
          </tr>

          

     </table>

     
     </td></tr>
    </table>
  </div>
   
</body></html>