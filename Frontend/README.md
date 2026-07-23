# Frontend - Control de Asistencia Universitaria

Aplicacion movil hecha con React Native y Expo SDK 54. Esta parte es la interfaz que usan el administrador, el docente y el estudiante para manejar el control de asistencia universitaria.

## Tecnologias principales

- React Native
- Expo SDK 54
- TypeScript
- Expo Go
- expo-camera para escanear QR
- expo-location para obtener GPS
- react-native-qrcode-svg para generar codigos QR
- lucide-react-native para iconos

## Como ejecutar

Instalar dependencias:

```bash
npm install
```

Iniciar Expo en modo LAN:

```bash
npx expo start --lan
```

Luego abrir la app desde Expo Go en el celular.

Importante: el celular y la computadora deben estar en la misma red Wi-Fi. El backend debe estar encendido antes de probar login, usuarios, materias y asistencia.

## Conexion con el backend

La comunicacion con Laravel esta centralizada en:

```text
src/services/attendanceApi.ts
```

En ese archivo se configura la URL base de la API. Para probar desde un celular fisico se debe usar la IP local de la computadora, por ejemplo:

```text
http://192.168.100.11:8000/api
```

No se debe usar `localhost` desde el celular, porque `localhost` apuntaria al propio telefono y no a la computadora.

## Flujo general de la app

1. El usuario inicia sesion.
2. El backend devuelve el usuario autenticado y su rol.
3. La app muestra una interfaz distinta segun el rol:
   - Administrador
   - Docente
   - Estudiante
4. La app carga datos reales desde el backend:
   - Usuarios
   - Estudiantes
   - Materias
   - Asignaciones
   - Sesiones de asistencia
   - Registros de asistencia

## Flujo del administrador

El administrador se encarga de preparar el sistema:

- Crear estudiantes con correo `nombre@uleam.edu.ec`.
- Crear docentes.
- Crear materias.
- Asignar docentes a materias.
- Asignar estudiantes a materias.
- Activar o desactivar usuarios.
- Editar informacion de usuarios.
- Revisar reportes generales.

Cuando un usuario esta desactivado, no puede iniciar sesion y tampoco aparece como docente disponible para asignaciones.

## Flujo del docente

El docente solo ve las materias que tiene asignadas.

Para tomar asistencia:

1. Entra a una materia.
2. Genera una sesion de asistencia.
3. La app toma la ubicacion GPS del docente.
4. Se genera un codigo QR.
5. Los estudiantes escanean ese QR desde su app.
6. Al finalizar, el docente cierra la sesion.
7. El backend marca como ausentes a los estudiantes asignados que no registraron asistencia.

## Flujo del estudiante

El estudiante usa la app principalmente para registrar y consultar su asistencia.

Para registrar asistencia:

1. Inicia sesion.
2. Entra a la opcion de escanear QR.
3. Escanea el QR generado por el docente.
4. La app solicita la ubicacion GPS del estudiante.
5. El backend valida:
   - Que el QR exista.
   - Que la sesion este abierta.
   - Que el estudiante pertenezca a la materia.
   - Que este dentro del rango permitido.
6. Si todo esta correcto, queda marcado como presente.

Tambien puede ver su resumen de asistencias y faltas, calculado con los registros reales del backend.

## Estructura de archivos

```text
App.tsx
```

Archivo principal de la app. Maneja el estado global, el login, el usuario autenticado, la carga de datos desde el backend y decide que pantallas mostrar segun el rol.

```text
index.ts
```

Punto de entrada de Expo.

```text
app.json
```

Configuracion general de Expo, permisos y datos basicos de la aplicacion.

```text
src/types.ts
```

Define los tipos principales de TypeScript: usuarios, estudiantes, materias, sesiones de asistencia, registros, formularios y respuestas de API.

```text
src/theme.ts
```

Define colores, medidas y valores visuales reutilizados por la app.

```text
src/styles.ts
```

Estilos compartidos entre pantallas.

```text
src/services/attendanceApi.ts
```

Contiene todas las funciones que llaman al backend: login, logout, cargar datos, crear usuarios, editar usuarios, activar/desactivar, crear materias, asignar estudiantes, generar QR, validar asistencia y cerrar sesiones.

```text
src/utils/validation.ts
```

Validaciones reutilizables, por ejemplo formato de correo institucional.

```text
src/utils/text.ts
```

Funciones pequenas para manejo de textos.

```text
src/components/common.tsx
```

Componentes comunes reutilizados en varias pantallas, como campos de texto, botones, tarjetas o estados visuales.

```text
src/components/navigation.tsx
```

Componentes de navegacion inferior y estructura comun de pantallas por rol.

```text
src/screens/AuthScreen.tsx
```

Pantalla de login.

```text
src/screens/admin/AdminScreens.tsx
```

Pantallas del administrador: panel, usuarios, materias, asignacion de estudiantes y reportes.

```text
src/screens/teacher/TeacherScreens.tsx
```

Pantallas del docente: inicio, clases asignadas, generar QR, cerrar asistencia y reportes.

```text
src/screens/student/StudentScreens.tsx
```

Pantallas del estudiante: resumen, escaneo de QR, historial de asistencia y faltas.

```text
src/screens/CoursesScreen.tsx
```

Pantalla relacionada con materias/cursos compartida o reutilizada por el flujo de administracion.

## Datos reales y datos de prueba

La app ya trabaja conectada al backend. Las pantallas principales consumen datos desde la API de Laravel y no dependen de datos mock para el flujo normal.

Para presentar, conviene crear datos desde el administrador:

- Un docente.
- Dos o tres estudiantes.
- Una materia.
- Asignar el docente a la materia.
- Asignar estudiantes a la materia.
- Generar una asistencia y escanear el QR.
