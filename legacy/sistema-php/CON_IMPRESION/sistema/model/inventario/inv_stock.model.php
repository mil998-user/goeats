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

    public function listar($data)
    {
        try
        {
            $stm = $this->conexionn->prepare("SELECT * FROM v_inventario WHERE id_tipo_ins LIKE ?");
            $stm->execute(array($data['tipo_ins']));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Presentacion'} = $this->conexionn->query("SELECT * FROM v_insprod WHERE id_tipo_ins = ".$d->id_tipo_ins." AND id_ins = ".$d->id_ins)
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
}