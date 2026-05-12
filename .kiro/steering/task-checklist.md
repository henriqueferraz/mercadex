# Regra: Marcar tarefas concluídas no checklist

Sempre que uma tarefa de um arquivo em `tasks/` for concluída com sucesso,
atualizar o checklist correspondente no arquivo de tarefas, marcando o item
de `[ ]` para `[x]`.

## Quando aplicar

- Após concluir qualquer tarefa descrita em arquivos dentro de `tasks/`
- O checklist pode estar no final do arquivo (seção "Checklist Final") ou
  inline junto à descrição da tarefa
- Marcar apenas o item da tarefa efetivamente concluída — não marcar itens
  que não foram executados na sessão atual

## Como fazer

1. Ler o arquivo de tarefas relevante
2. Localizar o item `[ ]` correspondente à tarefa concluída
3. Substituir por `[x]`
4. Salvar o arquivo

## Exemplo

Antes:
```
- [ ] Schema Prisma criado e migration executada
```

Depois:
```
- [x] Schema Prisma criado e migration executada
```
