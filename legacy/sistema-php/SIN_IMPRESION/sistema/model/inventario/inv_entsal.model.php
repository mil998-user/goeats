<?php
include_once("model/rest.model.php");

class InventarioModel
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
            $stm = $this->conexionn->prepare("SELECT * FROM tm_inventario_entsal");
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

    public function detalle($data)
    {
        try
        {
            $stm = $this->conexionn->prepare("SELECT * FROM tm_inventario WHERE id_tipo_ope = ? AND id_ope = ?");
            $stm->execute(array($data['cod_top'], $data['cod_ope']));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Pres'} = $this->conexionn->query("SELECT * FROM v_insprod WHERE id_tipo_ins = ".$d->id_tipo_ins."  AND id_ins = ".$d->id_ins)
                    ->fetch(PDO::FETCH_OBJ);
            }
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function anular($data)
    {
        try 
        {
            $consulta = "call usp_invESAnular( :flag, :idEs, :idTo);";
            $arrayParam =  array(
                ':flag' => 1,
                ':idEs' => $data->__GET('cod_es'),
                ':idTo' => $data->__GET('cod_tipo')
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

    public function buscarInsumo($cadena)
    {
        try
        {        
            $stm = $this->conexionn->prepare("SELECT * FROM v_insprod WHERE cod_ins LIKE '%$cadena%' OR nomb_ins LIKE '%$cadena%' ORDER BY nomb_ins LIMIT 5");
            $stm->execute();
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Medida'} = $this->conexionn->query("SELECT grupo FROM tm_tipo_medida WHERE id_med = ".$d->id_med)
                ->fetch(PDO::FETCH_OBJ);
            }
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

    public function registrar($data)
    {
        try 
        {
            date_default_timezone_set($_SESSION["zona_horaria"]);
            setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
            $fecha_r = date("Y-m-d H:i:s");
            /* Registramos el comprobante */
            $sql = "INSERT INTO tm_inventario_entsal(id_tipo, id_usu, motivo, fecha) VALUES (?, ?, ?, ?);";
            $this->conexionn->prepare($sql)
                      ->execute(
                        array(
                            $data['id_ope'],
                            $_SESSION["id_usu"],
                            $data["motivo"],
                            $fecha_r
                        ));

            /* El ultimo ID que se ha generado */
            $id = $this->conexionn->lastInsertId();
            
            /* Recorremos el detalle para insertar */
            foreach($data['items'] as $d)
            {
                $sql = "INSERT INTO tm_inventario (id_tipo_ope,id_ope,id_tipo_ins,id_ins,cos_uni,cant,fecha_r) 
                        VALUES (?, ?, ?, ?, ?, ? ,?)";
                
                $this->conexionn->prepare($sql)
                          ->execute(
                            array(
                                $data['id_ope'],
                                $id,
                                $d['producto_tipo'],
                                $d['producto_id'],
                                $d['precio'],
                                $d['cantidad'],
                                $fecha_r
                            ));
            }
            
            return true;
        }
        catch (Exception $e) 
        {
            return false;
        }
    }
}