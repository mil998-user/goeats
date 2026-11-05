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

    public function Impresora()
    {
        try
        {    
            $stm = $this->conexionn->prepare("SELECT * FROM tm_impresora WHERE estado = 'a'");
            $stm->execute();            
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ListaAreasP($data)
    {
        try
        {
           
            $stm = $this->conexionn->prepare("SELECT * FROM tm_area_prod WHERE id_areap like ?");
            $stm->execute(array($data['codigo']));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Impresora'} = $this->conexionn->query("SELECT nombre FROM tm_impresora WHERE id_imp = ".$d->id_imp)
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

    public function CAreasP($data)
    {
        try
        {
            $consulta = "call usp_configAreasProd( :flag, :idImp, :nombre, :estado, @a);";
            $arrayParam =  array(
                ':flag' => 1,
                ':idImp' => $data['cod_imp'],
                ':nombre' => $data['nomb_area'],
                ':estado' => $data['estado_area']
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

    public function UAreasP($data)
    {
        try 
        {
            $consulta = "call usp_configAreasProd( :flag, :idImp, :nombre, :estado, :idArea);";
            $arrayParam =  array(
                ':flag' => 2,
                ':idImp' => $data['cod_imp'],
                ':nombre' => $data['nomb_area'],
                ':estado' => $data['estado_area'],
                ':idArea' => $data['cod_area']
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