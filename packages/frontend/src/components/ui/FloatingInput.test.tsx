import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import FloatingInput from './FloatingInput';
it('associates labels, validation and autocomplete while editing by keyboard', async () => {
  function Form() {
    const [value, setValue] = useState('');
    return <FloatingInput label="Tài khoản" value={value} onChange={setValue} autoComplete="username" error="Nhập tài khoản hợp lệ" />;
  }
  render(<Form />);
  const field = screen.getByRole('textbox', { name: 'Tài khoản' });
  expect(field).toHaveAccessibleDescription('Nhập tài khoản hợp lệ');
  expect(field).toHaveAttribute('aria-invalid', 'true');
  expect(field).toHaveAttribute('autocomplete', 'username');
  const user = userEvent.setup(); await user.tab(); await user.keyboard('demo');
  expect(field).toHaveValue('demo');
});
