# Fuentes de las imágenes

AUREA es un restaurante ficticio. Ninguna fotografía muestra un local, un plato
ni un equipo reales de la marca: ilustran el concepto como imágenes de
referencia. Los nombres de los platos se han escrito a partir de lo que se ve en
cada foto y son demostrativos, igual que los precios.

Todas las fotografías provienen de Unsplash (búsqueda filtrada por licencia
gratuita) y se usan bajo la [licencia Unsplash](https://unsplash.com/license).
Seleccionadas el 12 de octubre de 2026.

En esta primera versión **no están descargadas**: se cargan desde el CDN de
Unsplash (`images.unsplash.com`) con parámetros de tamaño y formato
(`auto=format`, `fit=crop`, `w`, `q=70`) y `srcset` por anchura. Para publicar
la web conviene descargarlas a una carpeta `img/` y completar la autoría de cada
una desde su página.

| Uso en la web | Identificador en el CDN |
| --- | --- |
| Portada | `photo-1663530761401-15eefb544889` |
| Filosofía: foto pequeña | `photo-1775498017681-b95215dd704f` |
| Filosofía: imagen que se expande | `photo-1774509625509-8c452b51649e` |
| Experiencia, acto I: ingredientes | `photo-1790293840932-a568128dbb1f` |
| Experiencia, acto II: preparación | `photo-1717321302149-3c6c9c76de67` |
| Experiencia, acto III: presentación | `photo-1577106263724-2c8e03bfe9cf` |
| Experiencia, acto IV: la mesa | `photo-1499715217757-2aa48ed7e593` |
| Carta: bocados de bienvenida | `photo-1577906096429-f73c2c312435` |
| Carta: crema de guisante y menta | `photo-1623073284788-0d846f75e329` |
| Carta: gamba roja | `photo-1761095596757-db038313df59` |
| Carta: lubina en salsa verde | `photo-1700481935677-26f2336f6f36` |
| Carta: lomo madurado | `photo-1728034782567-ca8da7f2d507` |
| Carta: pulpo a la llama | `photo-1764397514739-57a0ac81330d` |
| Carta: fresa, nata y helado | `photo-1780181612148-20a394ff0dff` |
| Carta: chocolate negro | `photo-1768326119181-5f3cfe0adb4c` |
| Carta: lionesa de pistacho | `photo-1759277513461-41fde7d24083` |
| Carta: old fashioned | `photo-1770164491578-09f08156db2d` |
| Carta: tinto por copas | `photo-1641759756543-20168fcab299` |
| Carta: martini seco | `photo-1773188243990-b50e86881bd7` |
| Galería: el pase | `photo-1777897352830-3355142a33d2` |
| Galería: la despensa | `photo-1761330439211-1f94741e8c4d` |
| Galería: la barra (imagen que se expande) | `photo-1778104959337-5260c89e2293` |
| Galería: la sala | `photo-1770736929333-4fb8cd5a1657` |
| Galería: mesa para dos | `photo-1779745227145-67d965135660` |
| Galería: el último gesto | `photo-1759741558258-f24a3e847968` |

Cada foto se abre en `https://images.unsplash.com/<identificador>`; el enlace a su
página en Unsplash y la autoría quedan pendientes de completar al descargarlas.

Notas:

- La foto de la barra es la de menor nitidez a pantalla completa (fondo muy
  desenfocado). Es la primera candidata a sustituir.

## Tipografías

Cormorant Garamond y Manrope, servidas desde Google Fonts (licencia SIL Open Font).

## Librerías

GSAP 3.13 (con ScrollTrigger y SplitText) y Lenis 1.3.4, servidas desde jsDelivr
con versión fija e integridad (`integrity`) declarada en `index.html`. Si se
cambia de versión hay que recalcular esos valores.
