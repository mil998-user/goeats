<?php
header('Content-type: text/html; charset=utf-8' , true );
$mensaje="";
require_once '../model/login.model.php';

if(isset($_POST["txt_usuario"]) and isset($_POST["txt_password"])){

	$usuario_login =trim($_POST["txt_usuario"]);
	$usuario_clave=trim($_POST["txt_password"]);
	$rol=trim($_POST["txt_rol"]);
	$caja=trim($_POST["txt_caja"]);
	$turno=trim($_POST["txt_turno"]);
	$areap=trim($_POST["txt_area"]);
	
	//Declaramos el Objeto
	$objeto_usuario = new Usuarios();
	$login=$objeto_usuario->Login($usuario_login,$usuario_clave,$rol);
	$datos_usuario=$objeto_usuario->DatosUsuario($usuario_login);
	$datos_empresa=$objeto_usuario->DatosEmpresa();
	$apc=$objeto_usuario->AperCaja($usuario_login,$caja,$turno);
	$ap=$objeto_usuario->AreaProduccion($usuario_login,$areap);
	$_SESSION["datosusuario"]=$datos_usuario;

	if($login == 1){
		//INGRESA AL SISTEMA
		$almm = $_SESSION["datosusuario"];
		foreach ($almm as $reg) {
			
			if($reg["id_rol"]==1 OR $reg["id_rol"]==2){
				//ADMINISTRADOR
					$datos_caja=$objeto_usuario->DatosCaja($usuario_login,$caja,$turno);
					$objeto_usuario=NULL;
					session_start();

					$_SESSION["datosusuario"]=$datos_usuario;
					$_SESSION["datosempresa"]=$datos_empresa;
					$_SESSION["datoscaja"]=$datos_caja;

					$du = $_SESSION["datosusuario"];
					foreach ($du as $d) {
						$id_usu = $d['id_usu'];
						//SE AGREGO PARA HACER PRUEBAS DE TIENDA
						$id_tie = $d['id_tie'];
					}

					$de = $_SESSION["datosempresa"];
					foreach ($de as $d) {
						$igv = ($d['imp_val'] / 100);
						$imp_icbper = $d['imp_icbper'];
						$moneda = $d['mon_val'];
						$tribAcr = $d['trib_acr'];
						$tribCar = $d['trib_car'];
						$diAcr = $d['di_acr'];
						$diCar = $d['di_car'];
						$impAcr = $d['imp_acr'];
						$monAcr = $d['mon_acr'];
					}

					$dc = $_SESSION["datoscaja"];
					foreach ($dc as $d) {
						$id_apc = $d['id_apc'];
					}

					$_SESSION["id_usu"] = $id_usu;
					$_SESSION["id_tie"] = $id_tie;
					$_SESSION["igv"] = $igv;
					$_SESSION["imp_icbper"] = $imp_icbper;
					$_SESSION["moneda"] = $moneda;
					$_SESSION["tribAcr"] = $tribAcr;
					$_SESSION["tribCar"] = $tribCar;
					$_SESSION["diAcr"] = $diAcr;
					$_SESSION["diCar"] = $diCar;
					$_SESSION["impAcr"] = $impAcr;
					$_SESSION["monAcr"] = $monAcr;
					$_SESSION["id_apc"] = $id_apc;
					$_SESSION["apertura"] = $apc;
					$_SESSION["rol_usr"] = $reg["id_rol"];

				if($apc == 1){
					//CAJA APERTURADA
	    			header("Location: ../lista_tm_tablero.php");
	    			
	    		} else{
	    			//CAJA SIN APERTURAR
	    			header("Location: ../advertencia.php");
	    		}
				
			}else if($reg["id_rol"]==3){
				//AREA DE PRODUCCION
				if($ap == 1){
					$objeto_usuario=NULL;
					session_start();
					$_SESSION["datosusuario"]=$datos_usuario;
					$_SESSION["datosempresa"]=$datos_empresa;

					$du = $_SESSION["datosusuario"];
					foreach ($du as $d) {
						$id_areap = $d['id_areap'];
					}
					$_SESSION["id_areap"] = $id_areap;
	    			header("Location: ../lista_area_prod.php");
				} else {
					header("Location: ../index.php?m=e");
				}
				
			}else if($reg["id_rol"]==4){

				//MOSO
				$objeto_usuario=NULL;
				session_start();
				$_SESSION["datosusuario"]=$datos_usuario;
				$_SESSION["datosempresa"]=$datos_empresa;
				$du = $_SESSION["datosusuario"];
				foreach ($du as $d) {
					$id_usu = $d['id_usu'];
				}

				$de = $_SESSION["datosempresa"];
				foreach ($de as $d) {
					$igv = ($d['imp_val'] / 100);
					$moneda = $d['mon_val'];
				}

				$_SESSION["id_usu"] = $id_usu;
				$_SESSION["moneda"] = $moneda;
				$_SESSION["rol_usr"] = $reg["id_rol"];
				$_SESSION["apertura"] = 1;
    			header("Location: ../inicio.php");

			}else {
				header("Location: ../index.php");
			}
		}
	}else{
		//NO INGRESA AL SISTEMA
		header("Location: ../index.php?m=e");
	}						
}
?>
