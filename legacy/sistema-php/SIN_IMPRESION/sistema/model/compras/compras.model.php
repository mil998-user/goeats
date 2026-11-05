<?php
include_once("model/rest.model.php");
class CompraModel
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
            $ifecha = date('Y-m-d',strtotime($_POST['ifecha']));
            $ffecha = date('Y-m-d',strtotime($_POST['ffecha']));
            $tdoc = $_POST['tdoc'];
            $cprov = $_POST['cprov'];
            $stm = $this->conexionn->prepare("SELECT * FROM v_compras WHERE (DATE(fecha_c) >= ? AND DATE(fecha_c) <= ?) AND id_tipo_doc like ? AND id_prov like ? GROUP BY id_compra");
            $stm->execute(array($ifecha,$ffecha,$tdoc,$cprov));
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

    public function detalle()
    {
        try
        {
            $cod = $_POST['cod'];
            $stm = $this->conexionn->prepare("SELECT * FROM tm_compra_detalle WHERE id_compra = ?");
            $stm->execute(array($cod));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Pres'} = $this->conexionn->query("SELECT cod_ins,nomb_ins,nomb_med FROM v_insprod WHERE id_tipo_ins = ".$d->id_tp."  AND id_ins = ".$d->id_pres)
                    ->fetch(PDO::FETCH_OBJ);
            }
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function registrar($data)
    {
        try
        {   
            date_default_timezone_set($_SESSION["zona_horaria"]);
            setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
            $fecha_r = date("Y-m-d H:i:s");
            $igv = $_SESSION["igv"];
            $id_usu = $_SESSION["id_usu"];
            $fecha = date('Y-m-d',strtotime($data['compra_fecha']));
            
            $sql = "INSERT INTO tm_compra (id_prov,id_tipo_compra,id_tipo_doc,id_usu,fecha_c,hora_c,serie_doc,num_doc,igv,total,descuento,observaciones,fecha_reg) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);";
            $this->conexionn->prepare($sql)
                ->execute(
                    array(
                        $data['cod_prov'],
                        $data['tipo_compra'],
                        $data['tipo_doc'],
                        $id_usu,
                        $fecha,
                        $data['compra_hora'],
                        $data['serie_doc'],
                        $data['num_doc'],
                        $igv,
                        $data['monto_total'],
                        $data['desc_comp'],
                        $data['observaciones'],
                        $fecha_r
                ));

            /* El ultimo ID que se ha generado */
            $compra_id = $this->conexionn->lastInsertId();

            if($data['tipo_compra'] == 2){

                $a = $data['mmcuota'];
                $b = $data['imcuota'];
                $c = $data['fmcuota'];

                for($x=0; $x < sizeof($a); ++$x)
                {
                    $sql = "INSERT INTO tm_compra_credito (id_compra,total,interes,fecha) VALUES (?,?,?,?);";
                    $this->conexionn->prepare($sql)->execute(array($compra_id,$a[$x],$b[$x],date('Y-m-d',strtotime($c[$x]))));
                }
            }

            /* Recorremos el detalle para insertar */
            foreach($data['items'] as $d)
            {
                $sqll = "INSERT INTO tm_compra_detalle (id_compra,id_tp,id_pres,cant,precio) VALUES (?,?,?,?,?)";
                $this->conexionn->prepare($sqll)->execute(array($compra_id,$d['tipo_p'],$d['cod_ins'],$d['cant_ins'],$d['precio_ins']));

                $sql = "INSERT INTO tm_inventario (id_tipo_ope,id_ope,id_tipo_ins,id_ins,cos_uni,cant,fecha_r) VALUES (?,?,?,?,?,?,?)";
                $this->conexionn->prepare($sql)->execute(array(1,$compra_id,$d['tipo_p'],$d['cod_ins'],$d['precio_ins'],$d['cant_ins'],$fecha_r));
            }

            return true;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function anular($cod_compra)
    {
        try 
        {
            $consulta = "call usp_comprasAnular( :flag, :idCom);";
            $arrayParam =  array(
                ':flag' => 1,
                ':idCom' => $cod_compra
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
    
    public function Proveedores()
    {
        try
        {      
            $stm = $this->conexionn->prepare("SELECT id_prov,ruc,razon_social FROM tm_proveedor");
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

    public function buscarProveedor($data)
    {
        try
        {        
            $stm = $this->conexionn->prepare("SELECT id_prov,ruc,razon_social FROM tm_proveedor WHERE estado <> 'i' AND (ruc LIKE '%$data%' OR razon_social LIKE '%$data%') ORDER BY ruc LIMIT 5");
            $stm->execute();
            return $stm->fetchAll(PDO::FETCH_OBJ);
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function buscarInsumo($data)
    {
        try
        {        
            $stm = $this->conexionn->prepare("SELECT id_tipo_ins,id_ins,cod_ins,nomb_ins,nomb_med FROM v_insprod WHERE cod_ins LIKE '%$data%' OR nomb_ins LIKE '%$data%' ORDER BY nomb_ins LIMIT 5");
            $stm->execute();
            return $stm->fetchAll(PDO::FETCH_OBJ);
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    //NUEVO PROVEEDOR
    public function nuevoProveedor($data)
    {
        try
        {
            $consulta = "call usp_comprasRegProveedor( :flag, :ruc, :razS, :direc, :telf, :email, :contc, @a);";
            $telefono = 0;
            if($data['telefono'] != '' and $data['telefono'] != null){
               $telefono = $data['telefono']; 
            }

            $arrayParam =  array(
                ':flag' => 1,
                ':ruc' => $data['ruc'],
                ':razS' => $data['razon_social'],
                ':direc' => $data['direccion'],
                ':telf' => $telefono,
                ':email' => $data['email'],
                ':contc' => $data['contacto']
            );
            $st = $this->conexionn->prepare($consulta);
            $st->execute($arrayParam);
            $c = $st->fetch(PDO::FETCH_OBJ);
            return $c;
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }    
}