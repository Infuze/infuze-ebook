# infuze-ebook

## Gulp tasks

```
gulp dev
```
To build and watch book 0-example
#
The default gulp requires the --book argument, for example
```
Gulp --book 1
```
... will deploy book 1 by copying to the **deploy** folder.
```
Gulp --book 1,2,4
```
... will deploy books 1, 2 & 4 by copying them to the **deploy** folder.
```
Gulp --book all
```
... will deploy **all** books by copying them to the **deploy** folder.
