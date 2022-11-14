From `packages/plugin-pages/__tests__/mock-fs/monorepo/packages/a/pages/using-pkg-a.md`

---

## Explicit modules

* {@page ~~}
  * {@page ~~:root-doc}
    * {@page ~~:root-doc/root-doc-child}
* {@page ~pkg-a}
  * {@page ~pkg-a:using-pkg-a}
* {@page ~pkg-b}
  * {@page ~pkg-b:using-pkg-b}
    * {@page ~pkg-b:using-pkg-b/details}
* {@page ~pkg-c}
  * {@page ~pkg-c:using-pkg-c}
  * {@page ~pkg-c:details}

## Relative modules

* {@page ~}
  * {@page ~:root-doc}
    * {@page ~:root-doc/root-doc-child}
  * {@page ~:using-pkg-a}
  * {@page ~:using-pkg-b}
    * {@page ~:using-pkg-b/details}
  * {@page ~:using-pkg-c}
  * {@page ~:details}

## Implicit relative modules

* {@page root-doc}
  * {@page root-doc/root-doc-child}
* {@page using-pkg-a}
* {@page using-pkg-b}
  * {@page using-pkg-b/details}
* {@page using-pkg-c}
* {@page details}

