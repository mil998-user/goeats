<?php
require_once 'view/inicio/imprimir/num_letras.php';
require_once('assets/lib/pdf/cellfit.php');
$de = $_SESSION["datosempresa"];
$du = $_SESSION["datosusuario"];
$texto = 'Guarda tu voucher. Es el sustento para validar tu compra. No se aceptan devoluciones de dinero.';

class FPDF_CellFiti extends FPDF_CellFit
{
    function AutoPrint($dialog=false)
    {
        //Open the print dialog or start printing immediately on the standard printer
        $param=($dialog ? 'true' : 'false');
        $script="print($param);";
        $this->IncludeJS($script);
    }
    
    function AutoPrintToPrinter($server, $printer, $dialog=false)
    {
        //Print on a shared printer (requires at least Acrobat 6)
        $script = "var pp = getPrintParams();";
        if($dialog)
            $script .= "pp.interactive = pp.constants.interactionLevel.full;";
            else
                $script .= "pp.interactive = pp.constants.interactionLevel.automatic;";
                $script .= "pp.printerName = '\\\\\\\\".$server."\\\\".$printer."';";
                $script .= "print(pp);";
                $this->IncludeJS($script);
    }
}

$pdf = new FPDF_CellFiti('P', 'mm', array(74,180));
$pdf->AddPage();
$pdf->SetMargins(-20,-20,-20);
$pdf->AddFont('LucidaConsole','','lucidaconsole.php');
$pdf->SetFont('LucidaConsole','',9);
//DETALLE DE LA EMPRESA
 
foreach($de as $reg) {
    
    //$pdf->Image('leon.jpg' , 80 ,22, 35 , 38,'JPG', 'http://www.desarrolloweb.com');
    /*
     if($data->id_tdoc == 2){
     $h = 5;
     }else{
     */ 
    $pathimagen = "assets/img";
    $pdf->Image($pathimagen."/". $reg['logo'], 5, 2, 65, 18);
    $h = 22;
    $pdf->SetXY(5, $h);//modificar solo esto
    $pdf->CellFitScale(64, 3,utf8_decode($data->Tiraje->contribuyente), 0, 1, 'C');

    $pdf->SetXY(5, $h+3);//modificar solo esto
    $pdf->CellFitScale(64, 3,utf8_decode($data->Tiraje->regimen), 0, 1, 'C');

    $pdf->SetXY(5, $h+8);//modificar solo esto
    $pdf->CellFitScale(64, 3,utf8_decode(str_replace("&amp;", "&", $reg['raz_soc']) ), 0, 1, 'C');

    foreach($du as $dde) {
        $pdf->SetXY(5, $h+12);//modificar solo esto
        $pdf->CellFitScale(64, 3,'Dir: '.utf8_decode($dde['direc_t']), 0, 1, 'C');
        $pdf->SetXY(5, $h+16);//modificar solo esto
        $pdf->CellFitScale(64, 3,'Celular: '.utf8_decode($dde['telf_t']), 0, 1, 'C');
    }

    $pdf->SetXY(5, $h+20);//modificar solo esto
    $pdf->CellFitScale(64, 3,utf8_decode($data->Tiraje->ciudad.' - ECUADOR'), 0, 1, 'C');
    
    $pdf->SetFont('LucidaConsole','',16);
    $pdf->SetXY(5, $h+26);//modificar solo esto
    $pdf->CellFitScale(64, 3,utf8_decode($data->desc_td), 0, 1, 'C');
    $pdf->SetXY(5, $h+30);//modificar solo esto
    $documento = " ";
    if ($data->desc_td=="BOLETA"){
        $serie = "".$data->ser_doc;
        $documento = $data->Cliente->dni;
    } else if ($data->desc_td=="FACTURA"){
        $serie = "".$data->ser_doc;
        $documento = $data->Cliente->ruc;
    } else {
        $serie = "".$data->ser_doc;
        $documento = $data->Cliente->dni;
    }

    $pdf->SetFont('LucidaConsole','',10);
    $pdf->CellFitScale(64, 3,'Serie: '.utf8_decode($data->Tiraje->serie).'-00'.utf8_decode($data->secuencia), 0, 1, 'C');
    $pdf->SetXY(5, $h+34);//modificar solo esto
    $pdf->SetFont('LucidaConsole','',10);
    $pdf->CellFitScale(64, 3,'RUC: '.utf8_decode($reg['ruc']), 0, 1, 'C');

    $pdf->SetXY(5, $h+38);//modificar solo esto
    $pdf->SetFont('LucidaConsole','',10);
    $pdf->CellFitScale(64, 3,'AUT. SRI. N: '.utf8_decode($data->Tiraje->aut_sri), 0, 1, 'C');
    /*
     }
     */
    $pdf->SetFont('LucidaConsole','',9);
    $pdf->SetXY(2, $h+44);//modificar solo esto
    $pdf->CellFitScale(70, 3,'FECHA DE EMISION: '.date('d-m-Y h:i A',strtotime($data->fec_ven)), 0, 1, 'L');
    $pdf->SetXY(2, $h+46);//modificar solo esto
    $pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
    
    $pdf->SetFont('LucidaConsole','',7);
    $pdf->SetXY(2, $h+48);//modificar solo esto
    $pdf->CellFitScale(15, 3,'CLIENTE: ', 0, 1, 'L');
    $pdf->SetXY(17, $h+48);//modificar solo esto
    $nombre = ' ';
    if ($data->Cliente->nombre){
        $nombre = $data->Cliente->nombre;
    }
    $pdf->CellFitScale(55, 3,utf8_decode($nombre), 0, 1, 'L');
    $pdf->SetXY(2, $h+51);//modificar solo esto
    $pdf->CellFitScale(15, 3,utf8_decode($_SESSION["diAcr"]).'/'.utf8_decode($_SESSION["tribAcr"]).': ', 0, 1, 'L');
    $pdf->SetXY(17, $h+51);//modificar solo esto
    $pdf->CellFitScale(55, 3,utf8_decode($documento), 0, 1, 'L');
    $pdf->SetXY(2, $h+54);//modificar solo esto
    $pdf->CellFitScale(15, 3,'DIRECCION: ', 0, 1, 'L');
    $direccion = ' ';
    if ($data->Cliente->direccion){
        $direccion = $data->Cliente->direccion;
    }
    $pdf->SetXY(17, $h+54);//modificar solo esto
    $pdf->CellFitScale(55, 3,utf8_decode($direccion), 0, 1, 'L');
    
    $pdf->SetFont('LucidaConsole','',9);
    $pdf->SetXY(2, $h+56);//modificar solo esto
    $pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
    $pdf->SetXY(2, $h+59);//modificar solo esto
    $pdf->CellFitScale(40, 3,'PRODUCTO', 0, 1, 'L');
    $pdf->SetXY(42, $h+59);//modificar solo esto
    $pdf->CellFitScale(8, 3,'CANT', 0, 1, 'R');
    $pdf->SetXY(50, $h+59);//modificar solo esto
    $pdf->CellFitScale(11, 3,'P.UN.', 0, 1, 'R');
    $pdf->SetXY(61, $h+59);//modificar solo esto
    $pdf->CellFitScale(11, 3,'IMP.', 0, 1, 'R');
    $pdf->SetXY(2, $h+61);//modificar solo esto
    $pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
    $y = 64;
    $pdf->SetFont('LucidaConsole','',7);
    foreach($data->Detalle as $d){
        $pdf->SetXY(2, $h+$y);//modificar solo esto
        $pdf->CellFitScale(40, 3,utf8_decode($d->Producto->nombre_prod).' '.utf8_decode($d->Producto->pres_prod), 0, 1, 'L');
        $pdf->SetXY(42, $h+$y);//modificar solo esto
        $pdf->CellFitScale(8, 3,$d->cantidad, 0, 1, 'R');
        $pdf->SetXY(50, $h+$y);//modificar solo esto
        $pdf->CellFitScale(11, 3,$d->precio, 0, 1, 'R');
        $pdf->SetXY(61, $h+$y);//modificar solo esto
        $pdf->CellFitScale(11, 3,number_format(($d->cantidad * $d->precio),2), 0, 1, 'R');
        $y = $y + 3;
    }
    /*$y+...*/
    $pdf->SetFont('LucidaConsole','',9);
    $pdf->SetXY(2, $h+$y);//modificar solo esto
    $pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
    $pdf->SetXY(2, $h+$y+3);//modificar solo esto
    $pdf->CellFitScale(55, 3,'Importe Total: '.$_SESSION["moneda"], 0, 1, 'R');
    $pdf->SetXY(57, $h+$y+3);//modificar solo esto
    $pdf->CellFitScale(15, 3,number_format(($data->total),2), 0, 1, 'R');
    $pdf->SetXY(2, $h+$y+6);//modificar solo esto
    $pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
    $z = 3;
    /*$y+6+$z...*/
    
    $sbt = (($data->total - $data->descu) / (1 + $data->igv));
    $igv = ($sbt * $data->igv);
    
    /*id_tdoc==1 - boleta*/
    if($data->id_tdoc == 1){
        $pdf->SetXY(2, $h+$y+6+$z);//modificar solo esto
        $pdf->CellFitScale(55, 3,'Dscto: '.$_SESSION["moneda"], 0, 1, 'R');
        $pdf->SetXY(57, $h+$y+6+$z);//modificar solo esto
        $pdf->CellFitScale(15, 3,'-'.number_format(($data->descu),2), 0, 1, 'R');
        $pdf->SetXY(2, $h+$y+6+$z+4);//modificar solo esto
        $pdf->CellFitScale(55, 3,'Importe ICBPER: '.$_SESSION["moneda"], 0, 1, 'R');
        $pdf->SetXY(57, $h+$y+6+$z+4);//modificar solo esto
        $pdf->CellFitScale(15, 3,''.number_format(($data->bolsa),2), 0, 1, 'R');
        $a = 7;
    }else{
        $pdf->SetXY(2, $h+$y+6+$z);//modificar solo esto
        $pdf->CellFitScale(55, 3,'Dscto: '.$_SESSION["moneda"], 0, 1, 'R');
        $pdf->SetXY(57, $h+$y+6+$z);//modificar solo esto
        $pdf->CellFitScale(15, 3,'-'.number_format(($data->descu),2), 0, 1, 'R');
        $pdf->SetXY(2, $h+$y+6+$z+3);//modificar solo esto
        $pdf->CellFitScale(55, 3,'SubTotal: '.$_SESSION["moneda"], 0, 1, 'R');
        $pdf->SetXY(57, $h+$y+6+$z+3);//modificar solo esto
        $pdf->CellFitScale(15, 3,number_format(($sbt),2), 0, 1, 'R');
        $pdf->SetXY(2, $h+$y+6+$z+6);//modificar solo esto
        $pdf->CellFitScale(55, 3,$_SESSION["impAcr"].'('.$data->igv.'): '.$_SESSION["moneda"], 0, 1, 'R');
        $pdf->SetXY(57, $h+$y+6+$z+6);//modificar solo esto
        $pdf->CellFitScale(15, 3,number_format(($igv),2), 0, 1, 'R');
        $pdf->SetXY(2, $h+$y+6+$z+9);//modificar solo esto
        
        
        $a = 11;
    }
    /*$y+6+$z+$a...*/
    $pdf->SetXY(2, $h+$y+6+$z+$a);//modificar solo esto
    $pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
    $pdf->SetXY(2, $h+$y+6+$z+$a+3);//modificar solo esto
    $pdf->CellFitScale(55, 3,'TOTAL A PAGAR: '.$_SESSION["moneda"], 0, 1, 'R');
    $pdf->SetXY(57, $h+$y+6+$z+$a+3);//modificar solo esto
    $pdf->CellFitScale(15, 3,number_format(($data->total - $data->descu ),2), 0, 1, 'R');
    $pdf->SetXY(2, $h+$y+6+$z+$a+6);//modificar solo esto
    $pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');

    $pdf->SetXY(2, $h+$y+6+$z+$a+9);//modificar solo esto
    $pdf->CellFitScale(70, 3,'SON: '.numtoletras($data->total - $data->descu ), 0, 1, 'L');

    $pdf->SetXY(2, $h+$y+6+$z+$a+12);//modificar solo esto
    $pdf->CellFitScale(70, 3,'FORMA DE PAGO: '.utf8_decode($data->desc_tp), 0, 1, 'L');

    $pdf->SetFont('LucidaConsole','',7);
    $pdf->SetXY(2, $h+$y+6+$z+$a+24);//modificar solo esto
    $pdf->MultiCell(35, 3,"---------------",0,'C',0,15);

    $pdf->SetFont('LucidaConsole','',7);
    $pdf->SetXY(35, $h+$y+6+$z+$a+24);//modificar solo esto
    $pdf->MultiCell(35, 3,"---------------",0,'C',0,15);

    $pdf->SetXY(2, $h+$y+6+$z+$a+26);//modificar solo esto
    $pdf->MultiCell(35, 3,"F. AUTORIZA",0,'C',0,15);

    $pdf->SetXY(35, $h+$y+6+$z+$a+26);//modificar solo esto
    $pdf->MultiCell(35, 3,"F. CLIENTE",0,'C',0,15);

    $pdf->SetFont('LucidaConsole','',6);
    $pdf->SetXY(2, $h+$y+6+$z+$a+32);//modificar solo esto
    $pdf->MultiCell(70,3,'Imprenta '.utf8_decode($data->Tiraje->imprenta) .' RUC: '.utf8_decode($data->Tiraje->imp_ruc).' '.utf8_decode(' Autorización N° ').utf8_decode($data->Tiraje->imp_num_aut).' '.utf8_decode('Fecha de emisión: ').utf8_decode($data->Tiraje->imp_fecha_emision).' '.utf8_decode($data->Tiraje->imp_valido).utf8_decode(' Del comprobante de venta válido para emisión hasta: ').'  '.utf8_decode($data->Tiraje->imp_fecha_valido) ,0,'C');
   

   
    
}
$pdf->AutoPrint(true);
$pdf->Output();
?>
