import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../models/user.dart';

class AuthState {
  final bool isLoading;
  final User? user;
  final String? error;

  AuthState({this.isLoading = false, this.user, this.error});

  AuthState copyWith({bool? isLoading, User? user, String? error, bool clearError = false}) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    Future.microtask(() => _checkAuth());
    return AuthState();
  }

  Future<void> _checkAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    
    if (token != null) {
      try {
        state = state.copyWith(isLoading: true);
        final dio = ref.read(dioProvider);
        final response = await dio.get('/auth/profile');
        if (response.data['success']) {
          state = state.copyWith(
            user: User.fromJson(response.data['user']),
            isLoading: false,
          );
        } else {
          await logout();
        }
      } catch (e) {
        await logout();
      }
    }
  }

  Future<bool> login(String username, String password) async {
    try {
      state = state.copyWith(isLoading: true, clearError: true);
      final dio = ref.read(dioProvider);
      final response = await dio.post('/auth/login', data: {
        'username': username,
        'password': password,
      });

      if (response.data['success']) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', response.data['token']);
        
        state = state.copyWith(
          user: User.fromJson(response.data['user']),
          isLoading: false,
        );
        return true;
      }
      return false;
    } catch (e) {
      String errorMessage = 'Error de conexión';
      if (e is DioException && e.response != null) {
        errorMessage = e.response?.data['message'] ?? 'Error al iniciar sesión';
      }
      state = state.copyWith(isLoading: false, error: errorMessage);
      return false;
    }
  }

  Future<bool> register(
    String username,
    String password,
    String name,
    String email,
    String cedula,
    String phone,
  ) async {
    try {
      state = state.copyWith(isLoading: true, clearError: true);
      final dio = ref.read(dioProvider);
      final response = await dio.post('/auth/register-customer', data: {
        'username': username,
        'password': password,
        'name': name,
        'email': email,
        'cedula': cedula,
        'phone': phone,
      });

      if (response.data['success']) {
        return await login(username, password);
      }
      return false;
    } catch (e) {
      String errorMessage = 'Error de conexión';
      if (e is DioException && e.response != null) {
        errorMessage = e.response?.data['message'] ?? 'Error al registrarse';
      }
      state = state.copyWith(isLoading: false, error: errorMessage);
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    state = AuthState(user: null);
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});
