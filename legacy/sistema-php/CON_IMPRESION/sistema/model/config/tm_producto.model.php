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

    public function ListaProd()
    {
        try
        {
            $cod = $_POST['cod'];
            $cat = $_POST['cat'];
            $stm = $this->conexionn->prepare("SELECT * FROM tm_producto WHERE id_prod like ? AND id_catg like ? ORDER BY id_prod DESC");
            $stm->execute(array($cod,$cat));
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

    public function ListaPres()
    {
        try
        {
            $cod_prod = $_POST['cod_prod'];
            $cod_pres = $_POST['cod_pres'];
            $stm = $this->conexionn->prepare("SELECT * FROM tm_producto_pres WHERE id_prod LIKE ? AND id_pres LIKE ?");
            $stm->execute(array($cod_prod,$cod_pres));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'TipoProd'} = $this->conexionn->query("SELECT id_tipo FROM tm_producto WHERE id_prod = ".$d->id_prod)
                ->fetch(PDO::FETCH_OBJ);
            }
            $data = array("data" => $c);
            $json = json_encode($data);
            echo $json; 
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ListaCatgs()
    {
        try
        {
            $stm = $this->conexionn->prepare("SELECT * FROM tm_producto_catg");
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

    public function ListaIngs($data)
    {
        try
        {
            $stm = $this->conexionn->prepare("SELECT * FROM tm_producto_ingr WHERE id_pres = ?");
            $stm->execute(array($data['cod']));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Insumo'} = $this->conexionn->query("SELECT nomb_med,nomb_ins FROM v_insprod WHERE id_tipo_ins = ".$d->id_tipo_ins." AND id_ins = ".$d->id_ins)
                ->fetch(PDO::FETCH_OBJ);
            }
            foreach($c as $k => $d)
            {
                $c[$k]->{'Medida'} = $this->conexionn->query("SELECT descripcion FROM tm_tipo_medida WHERE id_med = ".$d->id_med)
                ->fetch(PDO::FETCH_OBJ);
            }
            $data = array("data" => $c);
            $json = json_encode($data);
            echo $json; 
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ListarAreasP()
    {
        try
        {      
            $stm = $this->conexionn->prepare("SELECT * FROM tm_area_prod WHERE estado ='a'");
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

    public function ListarUniMed()
    {
        try
        {      
            $stm = $this->conexionn->prepare("SELECT * FROM tm_tipo_medida");
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

    public function BuscarIns($criterio)
    {
        try
        {        
            $stm = $this->conexionn->prepare("SELECT * FROM v_insprod WHERE (nomb_ins LIKE '%$criterio%' OR cod_ins LIKE '%$criterio%') ORDER BY nomb_ins LIMIT 5");
            $stm->execute();
            return $stm->fetchAll(PDO::FETCH_OBJ);
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function CCatg($data)
    {
        try 
        {
            $consulta = "call usp_configProductoCatgs( :flag, :descC, @a);";
            $arrayParam =  array(
                ':flag' => 1,
                ':descC' => $data['nombre_catg']
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
                return $row['cod'];
            }
        }
        catch (Exception $e) 
        {
            return false;
        }
    }

    public function UCatg($data)
    {
        try 
        {
            $consulta = "call usp_configProductoCatgs( :flag, :descC, :idCatg);";
            $arrayParam =  array(
                ':flag' => 2,
                ':descC' => $data['nombre_catg'],
                ':idCatg' => $data['cod_catg']
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
                return $row['cod'];
            }
        }
        catch (Exception $e) 
        {
            return false;
        }
    }

    public function CProd($data)
    {
        try
        {
            $consulta = "call usp_configProducto( :flag, :idTipo, :idCatg, :idArea, :nombP, :descP, @a, @b);";
            $arrayParam =  array(
                ':flag' => 1,
                ':idTipo' => $data['tipo_prod'],
                ':idCatg' => $data['cod_catg'],
                ':idArea' => $data['cod_area'],
                ':nombP' => $data['nombre_prod'],
                ':descP' => $data['descripcion']
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
                return $row['cod'];
            }
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function UProd($data)
    {
        try 
        {
            $consulta = "call usp_configProducto( :flag, :idTipo, :idCatg, :idArea, :nombP, :descP, :estado, :idProd);";
            $arrayParam =  array(
                ':flag' => 2,
                ':idTipo' => $data['tipo_prod'],
                ':idCatg' => $data['cod_catg'],
                ':idArea' => $data['cod_area'],
                ':nombP' => $data['nombre_prod'],
                ':descP' => $data['descripcion'],
                ':estado' => $data['estado_catg'],
                ':idProd' => $data['cod_prod']
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
                return $row['cod'];
            }
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function CPres($data)
    {
        try 
        {
            if( !empty( $_FILES['imagen']['name'] ) ){
                switch ($_FILES['imagen']['type']) 
                { 
                    case 'image/jpeg': 
                    $ext = "jpg"; 
                    break;
                    case 'image/gif': 
                    $ext = "gif"; 
                    break; 
                    case 'image/png': 
                    $ext = "png"; 
                    break;
                    case 'application/pdf':
                    $ext = "pdf";
                    break;
                } 
                $imagen = date('ymdhis').'.'.$ext;
                move_uploaded_file ($_FILES['imagen']['tmp_name'], 'assets/img/productos/'.$imagen);
            } else {
                $imagen = $data['imagen'];
            }
            $consulta = "call usp_configProductoPres( :flag, :idProd, :codP, :presP, :precio, :rec, :stock, :estado, :img, @a, :opciones, :limite);";
			$receta = 0;
			$stockmin = 0;
			if($data['id_receta'] != '' and $data['id_receta'] != null){
				$receta = $data['id_receta'];
			}
			
			if($data['stock_min'] != '' and $data['stock_min'] != null){
				$stockmin = $data['stock_min'];
			}
			
            $arrayParam =  array(
                ':flag' => 1,
                ':idProd' => $data['cod_producto'],
                ':codP' => $data['cod_produ'],
                ':presP' => $data['nombre_pres'],
                ':precio' => $data['precio_prod'],
                ':rec' => $receta,
                ':stock' => $stockmin,
                ':estado' => $data['estado_pres'],
                ':img' => $imagen,
                ':opciones' => $data['opciones'],
                ':limite' => $data['limite']
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
                return $row['cod'];
            }
        }
        catch (Exception $e) 
        {
            return false;
        }
    }

    public function UPres($data)
    {
        try 
        {
            if( !empty( $_FILES['imagen']['name'] ) ){
                switch ($_FILES['imagen']['type']) 
                { 
                    case 'image/jpeg': 
                    $ext = "jpg"; 
                    break;
                    case 'image/gif': 
                    $ext = "gif"; 
                    break; 
                    case 'image/png': 
                    $ext = "png"; 
                    break;
                    case 'application/pdf':
                    $ext = "pdf";
                    break;
                }
                $imagen = date('ymdhis').'.'.$ext;
                move_uploaded_file ($_FILES['imagen']['tmp_name'], 'assets/img/productos/'.$imagen);
            } else {
                $imagen = $data['imagen'];
            }


            $consulta = "call usp_configProductoPres( :flag, :idProd, :codP, :presP, :precio, :rec, :stock, :estado, :img, :opciones, :limite, :idPres );";

			$receta = 0;
			$stockmin = 0;
            
			if($data['id_receta'] != '' and $data['id_receta'] != null){
				$receta = $data['id_receta'];
			}

			if($data['stock_min'] != '' and $data['stock_min'] != null){
				$stockmin = $data['stock_min'];
			}
            $arrayParam =  array(
                ':flag' => 2,
                ':idProd' => $data['cod_producto'],
                ':codP' => $data['cod_produ'],
                ':presP' => $data['nombre_pres'],
                ':precio' => $data['precio_prod'],
                ':rec' => $receta,
                ':stock' => $stockmin,
                ':estado' => $data['estado_pres'],
                ':img' => $imagen,
                ':opciones' => $data['opciones'],
                ':limite' => $data['limite'],
                ':idPres' => $data['cod_pres']
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
                return $row['cod'];
            }
        }
        catch (Exception $e) 
        {
            return false;
        }
    }

    public function ComboCatg()
    {
        try
        {
            $stm = $this->conexionn->prepare("SELECT * FROM tm_producto_catg");
            $stm->execute();
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ComboUniMed($data)
    {
        try
        {   
            $stmm = $this->conexionn->prepare("SELECT * FROM tm_tipo_medida WHERE grupo = ? OR grupo = ?");
            $stmm->execute(array($data['va1'],$data['va2']));
            $var = $stmm->fetchAll(PDO::FETCH_ASSOC);
            foreach($var as $v){
                echo '<option value="'.$v['id_med'].'">'.$v['descripcion'].'</option>';
            }
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function EliminarP($cod_prod_e)
    {
        try 
        {
            $consulta = "SELECT count(*) AS total FROM tm_detalle_pedido WHERE id_prod = :id_prod";
            $result = $this->conexionn->prepare($consulta);
            $result->bindParam(':id_prod',$cod_prod_e,PDO::PARAM_INT);
            $result->execute();
            if($result->fetchColumn()==0){
                $stm = $this->conexionn->prepare("DELETE FROM tm_producto WHERE id_prod = ?");          
                $stm->execute(array($cod_prod_e));
                echo("<script>location.href = 'lista_tm_productos.php';</script>");
                //header('Location: lista_tm_productos.php');
            }else{
                echo("<script>location.href = 'lista_tm_productos.php?m=e';</script>");
                //header('Location: lista_tm_productos.php?m=e');
            }
            $result->closeCursor();
            $this->conexionn=null;
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function GuardarIng($data)
    {
        try 
        {          
            $consulta = "call usp_configProductoIngrs( :flag, :idPres, :idTIns, :idIns, :idMed, :cant, :idPi);";
            $arrayParam =  array(
                ':flag' => 1,
                ':idPres' => $data['cod_pre'],
                ':idTIns' => $data['tipo_ins'],
                ':idIns' => $data['cod_ins'],
                ':idMed' => $data['cod_med'],
                ':cant' => $data['ins_cant'],
                ':idPi' => 1,
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
        }
        catch (Exception $e) 
        {
            return false;
        }
    }

    public function UIng($data)
    {
        try 
        {
            $consulta = "call usp_configProductoIngrs( :flag, :idPres, :idIns, :cant, :idPi);";
            $arrayParam =  array(
                ':flag' => 2,
                ':idPres' => 1,
                ':idIns' => 1,
                ':cant' => $data['cant'],
                ':idPi' => $data['cod'],
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
        }
        catch (Exception $e) 
        {
            return false;
        }
    }

    public function EIng($data)
    {
        try 
        {
            $consulta = "call usp_configProductoIngrs( :flag, :idPres, :idTIns, :idIns, :idMed, :cant, :idPi);";
            $arrayParam =  array(
                ':flag' => 3,
                ':idPres' => 1,
                ':idTIns' => 1,
                ':idIns' => 1,
                ':idMed' => 1,
                ':cant' => 1,
                ':idPi' => $data['cod'],
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
        }
        catch (Exception $e) 
        {
            return false;
        }
    }

    public function eliminarCategoria($data)
    {
        try 
        {
            $consulta = "call usp_configEliminarCategoriaProd(:id_catg);";
            $arrayParam =  array(
                ':id_catg' => $data['id_catg']
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
                return $row['cod'];
            }
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }
}