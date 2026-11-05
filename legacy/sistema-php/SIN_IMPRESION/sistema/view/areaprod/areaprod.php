<br>
<!--
<div class="wrapper text-right">
    <div class="btn-group">
        <button class="btn btn-white" type="button"><i class="fa fa-th-large"></i> Cuadricula</button>
        <button class="btn btn-white" type="button"><i class="fa fa-th-list"></i> Lista</button>
    </div>
</div>
-->
<div class="tabs-container">
    <ul class="nav nav-tabs">
        <li class="active" id="tab1"><a data-toggle="tab" href="#tab-1">&nbsp;&nbsp;<i class="icofont-dining-table icofont-2x"></i>MESA&nbsp;&nbsp;<span class="label label-primary" id="cant_pedidos_mesa"></span></a></li>
        <li id="tab2"><a data-toggle="tab" href="#tab-2">&nbsp;&nbsp;<i class="icofont-food-cart " style="font-size: 24px"></i>MOSTRADOR&nbsp;&nbsp;<span class="label label-primary" id="cant_pedidos_most"></span></a></li>
        <li id="tab3"><a data-toggle="tab" href="#tab-3">&nbsp;&nbsp;<i class="icofont-food-basket" style="font-size: 24px"></i>DELIVERY&nbsp;&nbsp;<span class="label label-primary" id="cant_pedidos_del"></span></a></li>
    </ul>
    <div class="tab-content">
        <div id="tab-1" class="tab-pane active">
            <div class="panel-body">

                <!--
                <div class="row">
                    <div class="col-lg-4">
                        <div class="panel panel-primary">
                            <div class="panel-heading">
                                Default Panel
                            </div>
                            <div class="panel-body">
                                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum tincidunt est vitae ultrices accumsan. Aliquam ornare lacus adipiscing, posuere lectus et, fringilla augue.</p>
                            </div>

                        </div>
                    </div>
                </div>
                -->

                <div class="col-lg-12">
                    <div class="row">
                        <ul class="sortable-list connectList agile-list">
                            <li class="list-group-item lihdcmo">
                                <div class="row">
                                    <div class="col-xs-1 col-md-1" style="text-align: center;">
                                        <strong>MESA</strong>
                                    </div>
                                    <div class="col-xs-4 col-md-4">
                                        <strong>CANT/PRODUCTO</strong>
                                    </div>
                                    <div class="col-xs-2 col-md-2" style="text-align: center;">
                                        <strong>HORA DE PEDIDO</strong>
                                    </div>
                                    <div class="col-xs-2 col-md-2" style="text-align: center;">
                                        <strong>ESTADO</strong>
                                    </div>
                                    <div class="col-xs-2 col-md-2">
                                        <strong>MOZO</strong>
                                    </div>
                                    <div class="col-xs-1 col-md-1"></div>
                                </div>
                            </li>
                            <div id="list_pedidos_mesa"></div>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <div id="tab-2" class="tab-pane">
            <div class="panel-body">
                <div class="col-lg-12">
                    <div class="row">
                        <ul class="sortable-list connectList agile-list">
                            <li class="list-group-item lihdcm">
                                <div class="row">
                                    <div class="col-xs-1 col-md-1" style="text-align: center;">
                                        <strong>PEDIDO</strong>
                                    </div>
                                    <div class="col-xs-4 col-md-4">
                                        <strong>CANT/PRODUCTO</strong>
                                    </div>
                                    <div class="col-xs-2 col-xs-2 col-md-2" style="text-align: center;">
                                        <strong>HORA DE PEDIDO</strong>
                                    </div>
                                    <div class="col-xs-2 col-md-2" style="text-align: center;">
                                        <strong>ESTADO</strong>
                                    </div>
                                    <div class="col-xs-2 col-md-2">
                                        <strong>CAJERO</strong>
                                    </div>
                                    <div class="col-xs-1 col-md-1"></div>
                                </div>
                            </li>
                            <div id="list_pedidos_most"></div>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <div id="tab-3" class="tab-pane">
            <div class="panel-body">
                <div class="col-lg-12">
                    <div class="row">
                        <ul class="sortable-list connectList agile-list">
                            <li class="list-group-item lihdcde">
                                <div class="row">
                                    <div class="col-xs-1 col-md-1" style="text-align: center;">
                                        <strong>PEDIDO</strong>
                                    </div>
                                    <div class="col-xs-4 col-md-4">
                                        <strong>CANT/PRODUCTO</strong>
                                    </div>
                                    <div class="col-xs-2 col-md-2" style="text-align: center;">
                                        <strong>HORA DE PEDIDO</strong>
                                    </div>
                                    <div class="col-xs-2 col-md-2" style="text-align: center;">
                                        <strong>ESTADO</strong>
                                    </div>
                                    <div class="col-xs-2 col-md-2">
                                        <strong>CAJERO</strong>
                                    </div>
                                    <div class="col-xs-1 col-md-1"></div>
                                </div>
                            </li>
                            <div id="list_pedidos_del"></div>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="assets/js/plugins/buzz/buzz.min.js"></script>
<script src="assets/scripts/areaprod/func_areap.js"></script>
<script type="text/javascript">
    $('#area-p').addClass("active");
</script>
