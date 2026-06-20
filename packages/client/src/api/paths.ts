export function modelToPath(model: string): string {
  return '/api/' + model.replace(/\./g, '/');
}
