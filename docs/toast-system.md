# Sistema de Toast - Mascate Pro

## Visão Geral

O sistema de toast da aplicação Mascate Pro substitui os popups nativos do navegador (alert, confirm) por notificações mais elegantes e modernas, usando a biblioteca `react-hot-toast` com componentes customizados.

## Componentes

### CustomToaster
Componente principal que deve ser incluído no App.tsx para renderizar os toasts na aplicação.

```tsx
import { CustomToaster } from '@/components/ui/Toast';

// No App.tsx
<AuthProvider>
  <AppRoutes />
  <CustomToaster />
</AuthProvider>
```

## Tipos de Toast

### 1. Toast de Sucesso
```tsx
import { showToast } from '@/components/ui/Toast';

showToast.success('Operação realizada com sucesso!');
```

### 2. Toast de Erro
```tsx
showToast.error('Erro ao realizar operação');
```

### 3. Toast de Aviso
```tsx
showToast.warning('Atenção: verificar dados antes de continuar');
```

### 4. Toast Informativo
```tsx
showToast.info('Informação importante para o usuário');
```

### 5. Toast de Loading
```tsx
// Mostra loading
const loadingToast = showToast.loading('Processando...');

// Atualiza para sucesso ou erro
showToast.updateLoading(loadingToast, 'success', 'Concluído!');
// ou
showToast.updateLoading(loadingToast, 'error', 'Erro no processamento');
```

## Toast de Confirmação

Substitui os `window.confirm()` nativos:

```tsx
import { showConfirmToast } from '@/components/ui/Toast';

const handleDelete = async () => {
  const confirmed = await showConfirmToast({
    message: 'Tem certeza que deseja excluir este item?',
    confirmText: 'Excluir',
    cancelText: 'Cancelar',
    type: 'danger' // 'warning' ou 'danger'
  });

  if (confirmed) {
    // Executar ação de exclusão
    showToast.success('Item excluído com sucesso!');
  }
};
```

## Configurações de Estilo

### Cores por Tipo
- **Sucesso**: Verde (#10B981) com fundo claro
- **Erro**: Vermelho (#EF4444) com fundo claro  
- **Aviso**: Amarelo Mascate (#F59E0B) com fundo claro
- **Info**: Azul (#3B82F6) com fundo claro

### Posicionamento
- Posição: top-right
- Duração padrão: 4 segundos
- Duração sucesso: 3 segundos
- Duração erro: 5 segundos
- Confirmação: não expira automaticamente

## Exemplos de Uso

### Em Formulários
```tsx
const handleSubmit = async (data) => {
  try {
    const loadingToast = showToast.loading('Salvando...');
    await saveData(data);
    showToast.updateLoading(loadingToast, 'success', 'Dados salvos!');
  } catch (error) {
    showToast.error('Erro ao salvar dados');
  }
};
```

### Em Operações CRUD
```tsx
const handleDelete = async (id: string) => {
  const confirmed = await showConfirmToast({
    message: 'Esta ação não pode ser desfeita. Continuar?',
    confirmText: 'Sim, excluir',
    type: 'danger'
  });

  if (confirmed) {
    try {
      await deleteItem(id);
      showToast.success('Item excluído com sucesso!');
    } catch (error) {
      showToast.error('Erro ao excluir item');
    }
  }
};
```

### Em Validações
```tsx
const validateForm = (data) => {
  if (!data.email) {
    showToast.warning('Email é obrigatório');
    return false;
  }
  return true;
};
```

## Migração de Alerts/Confirms

### Antes (Popups Nativos)
```tsx
// ❌ Antigo
alert('Sucesso!');
const confirmed = confirm('Tem certeza?');
```

### Depois (Sistema de Toast)
```tsx
// ✅ Novo
showToast.success('Sucesso!');
const confirmed = await showConfirmToast({
  message: 'Tem certeza?'
});
```

## Boas Práticas

1. **Use mensagens claras e concisas**
2. **Escolha o tipo apropriado** (success, error, warning, info)
3. **Para confirmações perigosas**, use `type: 'danger'`
4. **Para loading**, sempre atualize o toast no final
5. **Evite toasts muito longos** - quebrar em múltiplas linhas se necessário
6. **Use confirmação** apenas para ações irreversíveis

## Acessibilidade

- Toasts são anunciados por leitores de tela
- Podem ser fechados com teclado (ESC)
- Cores têm contraste adequado
- Ícones auxiliam na compreensão visual

## Troubleshooting

### Toast não aparece
- Verificar se `<CustomToaster />` está no App.tsx
- Importar corretamente: `import { showToast } from '@/components/ui/Toast'`

### Estilização não aplicada
- Verificar se Tailwind CSS está configurado
- Classes customizadas em `Toast.tsx` podem precisar de ajuste

### Performance
- Sistema otimizado para múltiplos toasts simultâneos
- Toasts antigos são removidos automaticamente
- Confirmações não afetam performance por serem Promise-based