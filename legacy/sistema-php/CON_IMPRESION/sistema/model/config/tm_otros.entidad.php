<?php
    class TipoDoc
    {
        public function __GET($k){ return $this->$k; }
        public function __SET($k, $v){ return $this->$k = $v; }
    }

    class Indicador
    {
        public function __GET($k){ return $this->$k; }
        public function __SET($k, $v){ return $this->$k = $v; }
    }

    class Datos
    {
        public function __GET($k){ return $this->$k; }
        public function __SET($k, $v){ return $this->$k = $v; }
    }

    class Tiraje
    {
        private $idtiraje;
        private $contribuyente;
        private $regimen;
        private $ciudad;
        private $serie;
        private $aut_sri;
        private $desde;
        private $hasta;
        private $id_comprobante;
        private $disponibles;
        private $imprenta;
        private $imp_dueno;
        private $imp_ruc;
        private $imp_num_aut;
        private $imp_fecha_emision;
        private $imp_valido;
        private $imp_fecha_valido;
        private $estado;

        public function __GET($k){ return $this->$k; }
        public function __SET($k, $v){ return $this->$k = $v; }
    }
?>