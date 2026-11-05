import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/ui/login_screen.dart';
import 'features/auth/ui/register_screen.dart';
import 'features/aggregator/ui/home_screen.dart';
import 'features/restaurant/ui/restaurant_screen.dart';
import 'features/checkout/ui/checkout_screen.dart';
import 'features/orders/ui/orders_screen.dart';
import 'features/profile/ui/profile_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  runApp(const ProviderScope(child: GoEatsApp()));
}

final routerProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const MainScaffold(child: HomeScreen()),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/restaurant/:slug',
        builder: (context, state) => MainScaffold(
          child: RestaurantScreen(slug: state.pathParameters['slug']!),
        ),
      ),
      GoRoute(
        path: '/checkout',
        builder: (context, state) => const MainScaffold(child: CheckoutScreen()),
      ),
      GoRoute(
        path: '/orders',
        builder: (context, state) => const MainScaffold(child: OrdersScreen()),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const MainScaffold(child: ProfileScreen()),
      ),
    ],
  );
  ref.onDispose(router.dispose);
  return router;
});

class GoEatsApp extends ConsumerWidget {
  const GoEatsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Mantiene activo el proveedor para restaurar la sesión al abrir la app.
    // Usa listen, no watch, para no reconstruir la app con cada cambio de sesión.
    ref.listen(authProvider, (previous, next) {});

    return MaterialApp.router(
      title: 'GoEats',
      theme: AppTheme.lightTheme,
      routerConfig: ref.watch(routerProvider),
      debugShowCheckedModeBanner: false,
    );
  }
}

class MainScaffold extends StatelessWidget {
  final Widget child;

  const MainScaffold({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        onDestinationSelected: (int index) {
          switch (index) {
            case 0:
              context.go('/');
              break;
            case 1:
              context.go('/checkout');
              break;
            case 2:
              context.go('/orders');
              break;
            case 3:
              context.go('/profile');
              break;
          }
        },
        selectedIndex: _calculateSelectedIndex(context),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Inicio',
          ),
          NavigationDestination(
            icon: Icon(Icons.shopping_cart_outlined),
            selectedIcon: Icon(Icons.shopping_cart),
            label: 'Carrito',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'Pedidos',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }

  int _calculateSelectedIndex(BuildContext context) {
    final String location = GoRouterState.of(context).uri.path;
    if (location.startsWith('/checkout')) return 1;
    if (location.startsWith('/orders')) return 2;
    if (location.startsWith('/profile')) return 3;
    return 0; // Default to Home
  }
}
