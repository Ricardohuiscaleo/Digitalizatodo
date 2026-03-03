# Dark Mode - Clases a agregar

Debido a la extensión del archivo (más de 1000 líneas), implementar dark mode requiere agregar clases `dark:` a cientos de elementos.

## Estrategia recomendada:

1. **Usar un plugin de Tailwind** para auto-generar variantes dark
2. **O** crear un archivo CSS separado con estilos dark personalizados
3. **O** usar JavaScript para cambiar entre temas completos

## Alternativa rápida:

Agregar solo las clases esenciales a elementos principales:
- Títulos: `dark:text-slate-100`
- Textos: `dark:text-slate-300`  
- Fondos blancos: `dark:bg-slate-800`
- Bordes: `dark:border-slate-700`
- Cards: `dark:bg-slate-800/50`

El botón toggle ya está funcionando. Solo falta aplicar las clases a cada elemento.
