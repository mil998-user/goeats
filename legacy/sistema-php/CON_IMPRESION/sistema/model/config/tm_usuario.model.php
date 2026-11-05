<?php
include_once("model/rest.model.php");


class ConfigModel
{
	
	private $conexionn;

	public function __CONSTRUCT()
	{
		try
		{
			$this->conexionn = Database::Conectar();     
		}
		catch(Exception $e)
		{
			die($e->getMessage());
		}
	}

	public function listar()
    {
        try
        {
            $stm = $this->conexionn->prepare("SELECT * FROM v_usuarios");
            $stm->execute();
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $data = array("data" => $c);
            $json = json_encode($data);
            echo $json;  
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

  	public function obtenerDatos($cod)
	{
		try 
		{
			$stm = $this->conexionn ->prepare("SELECT * FROM v_usuarios WHERE id_usu = ?");
			$stm->execute(array($cod));
			$r = $stm->fetch(PDO::FETCH_OBJ);
			$alm = new Usuario();
			$alm->__SET('id_usu', $r->id_usu);
			$alm->__SET('id_tie', $r->id_tie);
			$alm->__SET('id_rol', $r->id_rol);
			$alm->__SET('id_areap', $r->id_areap);
			$alm->__SET('dni', $r->dni);
      		$alm->__SET('ape_paterno', $r->ape_paterno);
			$alm->__SET('ape_materno', $r->ape_materno);
      		$alm->__SET('nombres', $r->nombres);
			$alm->__SET('email', $r->email);
			$alm->__SET('usuario', $r->usuario);
			$alm->__SET('contrasena', $r->contrasena);
			$alm->__SET('estado', $r->estado);
			$alm->__SET('imagen', $r->imagen);
			$alm->__SET('desc_r', $r->desc_r);
			$alm->__SET('desc_ap', $r->desc_ap);
			$alm->__SET('desc_t', $r->desc_t);
			$stm->closeCursor();
	      	return $alm;
	      	$this->conexionn=null;
		} 
		catch (Exception $e) 
		{
			die($e->getMessage());
		}
	}

	public function ListarTienda()
	{
	  	try
	  	{      
			$stm = $this->conexionn->prepare("SELECT * FROM tm_tienda");
			$stm->execute();            
			$c = $stm->fetchAll(PDO::FETCH_OBJ);
			$stm->closeCursor();
	      	return $c;
			$this->conexionn=null;
	  	}
	  	catch(Exception $e)
	  	{
			die($e->getMessage());
	  	}
	}

	public function ListarCatgRol()
	{
	    try
	    {      
	        $stm = $this->conexionn->prepare("SELECT * FROM tm_rol");
	        $stm->execute();            
	        $c = $stm->fetchAll(PDO::FETCH_OBJ);
	        $stm->closeCursor();
	        return $c;
	        $this->conexionn=null;
	    }
	    catch(Exception $e)
	    {
	        die($e->getMessage());
	    }
	}

	public function ListarAreaP()
	{
	  	try
	  	{      
			$stm = $this->conexionn->prepare("SELECT * FROM tm_area_prod");
			$stm->execute();            
			$c = $stm->fetchAll(PDO::FETCH_OBJ);
			$stm->closeCursor();
	      	return $c;
			$this->conexionn=null;
	  	}
	  	catch(Exception $e)
	  	{
			die($e->getMessage());
	  	}
	}

	public function registrar(Usuario $data)
	{
		try 
		{
			$consulta = "call usp_configUsuario( :flag, :idTie, :idRol, :idArea, :dni, :apeP, :apeM, :nomb, :email, :usu, :cont, :img, @a);";
			$idArea = 0;
			if($data->__GET('id_areap') != '' ){
				$idArea = $data->__GET('id_areap');
			}
        	$arrayParam =  array(
	            ':flag' => 1,
	            ':idTie' => $data->__GET('id_tie'),
	            ':idRol' => $data->__GET('id_rol'),
	            ':idArea' => $idArea,
	            ':dni' => $data->__GET('dni'),
	            ':apeP' => $data->__GET('ape_paterno'),
	            ':apeM' => $data->__GET('ape_materno'),
	            ':nomb' => $data->__GET('nombres'),
	            ':email' => $data->__GET('email'),
	            ':usu' => $data->__GET('usuario'),
	            ':cont' => $data->__GET('contrasena'),
	            ':img' => $data->__GET('imagen')
        	);
	        $st = $this->conexionn->prepare($consulta);
	        $st->execute($arrayParam);
	        $row = $st->fetch(PDO::FETCH_ASSOC);
	        return $row;
		} catch (Exception $e) 
		{
			die($e->getMessage());
		}
	}

	public function editar(Usuario $data)
	{
		try 
		{
			$consulta = "call usp_configUsuario( :flag, :idTie, :idRol, :idArea, :dni, :apeP, :apeM, :nomb, :email, :usu, :cont, :img, :idUsu);";
        	$arrayParam =  array(
            	':flag' => 2,
            	':idTie' => $data->__GET('id_tie'),
            	':idRol' => $data->__GET('id_rol'),
            	':idArea' => $data->__GET('id_areap'),
            	':dni' => $data->__GET('dni'),
	            ':apeP' => $data->__GET('ape_paterno'),
	            ':apeM' => $data->__GET('ape_materno'),
	            ':nomb' => $data->__GET('nombres'),
	            ':email' => $data->__GET('email'),
	            ':usu' => $data->__GET('usuario'),
	            ':cont' => $data->__GET('contrasena'),
	            ':img' => $data->__GET('imagen'),
	            ':idUsu' => $data->__GET('id_usu'),
        	);
	        $st = $this->conexionn->prepare($consulta);
	        $st->execute($arrayParam);
		} catch (Exception $e) 
		{
			die($e->getMessage());
		}
	}

	public function estado($data)
	{
		try 
		{
			$sql = "UPDATE tm_usuario SET estado = ? WHERE id_usu = ?";
			$this->conexionn->prepare($sql)->execute(array($data->__GET('estado'),$data->__GET('cod_usu')));
			$this->conexionn=null;     
		} catch (Exception $e) 
		{
			die($e->getMessage());
		}
	}

	public function eliminar($cod_usu_e)
	{
		try 
		{
			$consulta = "SELECT count(*) AS total FROM tm_venta WHERE id_usu = :id_usu";
      		$result = $this->conexionn->prepare($consulta);
      		$result->bindParam(':id_usu',$cod_usu_e,PDO::PARAM_INT);
      		$result->execute();
      		if($result->fetchColumn()==0){
				$stm = $this->conexionn->prepare("DELETE FROM tm_usuario WHERE id_usu = ?");          
				$stm->execute(array($cod_usu_e));
				echo("<script>location.href = 'lista_tm_usuarios.php';</script>");
				//header('Location: lista_tm_usuarios.php');
			} else {
				echo("<script>location.href = 'lista_tm_usuarios.php?m=e';</script>");
				//header('Location: lista_tm_usuarios.php?m=e');
			}
			$result->closeCursor();
			$this->conexionn=null;
		} 
		catch (Exception $e) 
		{
			die($e->getMessage());
		}
	}
}