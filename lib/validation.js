export function validationError(res, error) {
  return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
}
