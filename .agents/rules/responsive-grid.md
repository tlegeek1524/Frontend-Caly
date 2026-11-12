---
description: Responsive Grid & Mobile Layout Rules for Ant Design Row/Col and CSS
---

# Responsive Grid & Mobile Layout Rules

- **Do not override Ant Design `<Row>` / `<Col>` with `flex-wrap: nowrap` or `flex: 1 1 0`**:
  - `<Col xs={24} md={8}>` relies on `flex-wrap: wrap` on `<Row>` to stack full-width on mobile (`xs`) and split into columns on `md+`.
  - Never add `flex-wrap: nowrap` on a `.ant-row` container or `flex: 1 1 0` on `.ant-col` unless scoped inside `@media (min-width: 768px)`.
- **Avoid `<Divider type="vertical" />` between responsive `<Col>` items**:
  - Vertical dividers inside a wrapping `<Row>` break mobile stacking and waste space. Use `Row` `gutter={[16, 20]}` or CSS borders scoped to `@media (min-width: 768px)` instead.
- **Keep mobile card content readable**:
  - Always set `min-width: 0` on flex/grid children containing text or numbers so long labels/values wrap or truncate cleanly without overflowing.
