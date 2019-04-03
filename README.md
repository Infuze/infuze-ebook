# infuze-ebook

## Gulp tasks

**Dev**

```
gulp dev
```
To build and watch book 0-example
#
The default gulp requires the --book argument, for example
```
gulp --book 1
```
... will deploy book 1 by copying to the **deploy** folder.
```
gulp --book 1,2,4
```
... will deploy books 1, 2 & 4 by copying them to the **deploy** folder.
```
gulp --book all
```
... will deploy **all** books by copying them to the **deploy** folder.

**Scorm packs**
```
gulp pack --book 1
```
... will pack book 1 by copying to the **pack** folder.
```
gulp pack --book 1,2,4
```
... will pack books 1, 2 & 4 by copying them to the **pack** folder.
```
gulp pack --book all
```
... will pack **all** books by copying them to the **pack** folder.

