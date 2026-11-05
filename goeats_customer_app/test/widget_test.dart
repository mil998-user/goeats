import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:goeats_customer_app/core/network/api_client.dart';
import 'package:goeats_customer_app/features/auth/providers/auth_provider.dart';
import 'package:goeats_customer_app/features/auth/ui/login_screen.dart';
import 'package:goeats_customer_app/features/cart/providers/cart_provider.dart';
import 'package:goeats_customer_app/features/restaurant/models/menu_models.dart';
import 'package:goeats_customer_app/features/restaurant/ui/product_detail_sheet.dart';
import 'package:goeats_customer_app/main.dart';

final _item = MenuItem(
  id: 1,
  name: 'Hamburguesa',
  variants: [MenuItemVariant(id: 10, name: 'Normal', price: 5)],
);

Future<ProviderContainer> _pumpSheet(WidgetTester tester, int restaurantId) async {
  await tester.pumpWidget(
    ProviderScope(
      child: MaterialApp(
        home: Scaffold(
          body: Builder(
            builder: (context) => TextButton(
              onPressed: () => ProductDetailSheet.show(context, _item, restaurantId),
              child: const Text('abrir'),
            ),
          ),
        ),
      ),
    ),
  );
  final container = ProviderScope.containerOf(tester.element(find.text('abrir')));
  await tester.tap(find.text('abrir'));
  await tester.pumpAndSettle();
  return container;
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    dotenv.loadFromString(envString: 'API_BASE_URL=http://localhost:1/api');
  });

  testWidgets('la pantalla de login sigue abierta cuando cambia la sesión', (tester) async {
    final dio = Dio()
      ..interceptors.add(InterceptorsWrapper(onRequest: (options, handler) {
        handler.reject(DioException(requestOptions: options));
      }));
    await tester.pumpWidget(ProviderScope(
      overrides: [dioProvider.overrideWithValue(dio)],
      child: const GoEatsApp(),
    ));
    await tester.pump();

    GoRouter.of(tester.element(find.byType(NavigationBar))).go('/login');
    await tester.pump();
    await tester.pump();
    expect(find.byType(LoginScreen), findsOneWidget);

    final container = ProviderScope.containerOf(tester.element(find.byType(LoginScreen)));
    container.read(authProvider.notifier).login('usuario', 'clave');
    await tester.pump();
    await tester.pump();

    expect(find.byType(LoginScreen), findsOneWidget);
    await tester.pump(const Duration(seconds: 1));
  });

  test('el registro envía cédula y teléfono al backend', () async {
    final requests = <RequestOptions>[];
    final dio = Dio()
      ..interceptors.add(InterceptorsWrapper(onRequest: (options, handler) {
        requests.add(options);
        handler.resolve(Response(requestOptions: options, data: {
          'success': true,
          'token': 'token',
          'user': {'id': 1, 'username': 'ana', 'name': 'Ana', 'role': 'CUSTOMER'},
        }));
      }));
    final container = ProviderContainer(overrides: [dioProvider.overrideWithValue(dio)]);
    addTearDown(container.dispose);

    final ok = await container
        .read(authProvider.notifier)
        .register('ana', 'clave', 'Ana', 'ana@correo.com', '1100000000', '0990000000');

    expect(ok, isTrue);
    expect(requests.first.path, '/auth/register-customer');
    expect(requests.first.data['cedula'], '1100000000');
    expect(requests.first.data['phone'], '0990000000');
  });

  testWidgets('agregar un producto guarda el restaurante en el carrito', (tester) async {
    final container = await _pumpSheet(tester, 7);

    await tester.tap(find.textContaining('Agregar'));
    await tester.pumpAndSettle();

    final cart = container.read(cartProvider);
    expect(cart.restaurantId, 7);
    expect(cart.items.single.variantId, 10);
  });

  testWidgets('pide confirmación antes de vaciar el carrito de otro restaurante', (tester) async {
    final container = await _pumpSheet(tester, 7);
    final notifier = container.read(cartProvider.notifier);
    notifier.setRestaurant(3);
    notifier.addItem(variantId: 20, name: 'Grande', itemName: 'Pizza', price: 9, quantity: 1, comments: '');

    await tester.tap(find.textContaining('Agregar'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Cancelar'));
    await tester.pumpAndSettle();
    expect(container.read(cartProvider).restaurantId, 3);

    await tester.tap(find.textContaining('Agregar'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Vaciar y agregar'));
    await tester.pumpAndSettle();

    final cart = container.read(cartProvider);
    expect(cart.restaurantId, 7);
    expect(cart.items.single.variantId, 10);
  });
}
