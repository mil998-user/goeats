<!DOCTYPE html>
<?php 

   $full_name  = strip_tags($_POST['nombre']);
   $email      = strip_tags($_POST['email']);

   $asunto    = strip_tags($_POST['asunto']);

?>
<html lang="es">
    <head>
        <title>Reservas</title>  
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    </head>
    <body>
   <div style="border: 1px solid #6c91b2;border-radius: 10px; padding: 10px;">


     <table width='100%' bgcolor='white' cellpadding='0' cellspacing='0' border='0'>
     
     <tr><td>

     <table align='center' width='100%' border='0' cellpadding='0' cellspacing='0' style='max-width:650px; background-color:white; font-family:Verdana, Geneva, sans-serif;'>
      
  
        <tr height='80'>
         <th colspan='4' style='background-color:white; border-bottom:solid 0px #bdbdbd; font-family:Verdana, Geneva, sans-serif; color:#333; font-size:34px;' >
         <h4><?php echo $asunto; ?></h4>

        
          <p style='font-size: 16px;font-family: Verdana, Geneva, sans-serif;background-color: #333f50;color: white;text-align: center; font-weight: 200;padding: 15px;border-radius: 10px;'> <?php echo $full_name; ?></p>
         </th>
        </tr>
    
          

           <tr align='center' height='50' style='font-family:Verdana, Geneva, sans-serif;' style="width: 100%;">
           <td colspan='2' style='width: 40%'><p style='font-size: 14px;font-family: Verdana, Geneva, sans-serif;background-color: #547386;color: white;text-align: center; font-weight: 200;padding: 5px;border-radius: 5px;'> E-MAIL: </p></td>
           <td  colspan='2' style='width: 60%' ><p style='font-size: 14px;font-family: Verdana, Geneva, sans-serif;background-color: white;color: #7d8181;text-align: center; font-weight: 200;padding: 5px;border-radius: 5px;border: 1px solid #547386;margin-left: 3px;'> <?php echo $_POST["email"]; ?></p></td>
          </tr>
          <tr align='center' height='50' style='font-family:Verdana, Geneva, sans-serif;' style="width: 100%;">
           <td colspan='2' style='width: 40%'><p style='font-size: 14px;font-family: Verdana, Geneva, sans-serif;background-color: #547386;color: white;text-align: center; font-weight: 200;padding: 5px;border-radius: 5px;'> MENSAJE: </p></td>
           <td  colspan='2' style='width: 60%' ><p style='font-size: 14px;font-family: Verdana, Geneva, sans-serif;background-color: white;color: #7d8181;text-align: center; font-weight: 200;padding: 5px;border-radius: 5px;border: 1px solid #547386;margin-left: 3px;'> <?php echo $_POST["mensaje"]; ?></p></td>
          </tr>
         

          

     </table>

     
     </td></tr>
    </table>
  </div>
   
</body></html>