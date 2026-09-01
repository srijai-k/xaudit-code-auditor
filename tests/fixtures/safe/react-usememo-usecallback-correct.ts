import { useMemo, useCallback } from 'react';
export default function List({ items }) {
  const style = useMemo(() => ({ color: 'red' }), []);
  const onClick = useCallback(() => console.log('x'), []);
  return <Child style={style} data={items} onClick={onClick} />;
}
