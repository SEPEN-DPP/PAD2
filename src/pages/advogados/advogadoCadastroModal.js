/**
 * Modal de completar/editar cadastro de advogado — extraído de
 * advogadosPage.js (2026-07-20) para ser reaproveitado também pela seleção
 * de advogado na aba "Termo de Cientificação"
 * (src/pages/pad/detail/documentos/termoCientificacaoTab.js): ao escolher um
 * advogado da Relação que ainda não tem cadastro completo (ex.: falta
 * e-mail — a planilha original de importação não tinha essa coluna), o
 * mesmo modal e a mesma exigência de confirmação explícita valem nos dois
 * lugares — única fonte de verdade da regra "completo = true só depois de
 * confirmado", ver docs/firestore-schema.md §Relação de Advogados.
 */
import { criarElemento } from '../../utils/domUtils.js';
import { criarBotao } from '../../components/button/button.js';
import { abrirModal } from '../../components/modal/modal.js';
import { criarCampo } from '../pad/detail/documentos/_shared.js';
import { criarOuAtualizar } from '../../services/advogados/advogadoCadastroService.js';
import { usuarioAtual } from '../../services/auth/authService.js';
import { ehCampoObrigatorio } from '../../utils/validationUtils.js';
import { mostrarToast } from '../../utils/toast.js';

const CAMPOS_ENDERECO = [
  { chave: 'rua', rotulo: 'Rua' },
  { chave: 'numero', rotulo: 'Número' },
  { chave: 'complemento', rotulo: 'Complemento' },
  { chave: 'bairro', rotulo: 'Bairro' },
  { chave: 'cidade', rotulo: 'Cidade' },
  { chave: 'estado', rotulo: 'Estado' },
];

/** Monta os campos editáveis do cadastro — reaproveitado pelo modal de edição/completude. */
function criarCamposCadastro(dados, { oabEditavel }) {
  const campoNome = criarCampo({ rotulo: 'Nome completo', valor: dados?.nome });
  const campoOab = criarCampo({ rotulo: 'OAB', valor: dados?.oab });
  if (!oabEditavel) campoOab.input.disabled = true;
  const camposEndereco = CAMPOS_ENDERECO.map((c) => ({
    ...c,
    campo: criarCampo({ rotulo: c.rotulo, valor: dados?.endereco?.[c.chave] }),
  }));
  const campoTelefone = criarCampo({ rotulo: 'Telefone', valor: dados?.telefone });
  const campoEmail = criarCampo({ rotulo: 'E-mail', valor: dados?.email, tipo: 'email' });

  const corpo = [
    campoNome.elemento,
    campoOab.elemento,
    ...camposEndereco.map((c) => c.campo.elemento),
    campoTelefone.elemento,
    campoEmail.elemento,
  ];

  function lerDados() {
    return {
      nome: campoNome.input.value.trim(),
      oab: campoOab.input.value.trim(),
      endereco: Object.fromEntries(camposEndereco.map((c) => [c.chave, c.campo.input.value.trim()])),
      telefone: campoTelefone.input.value.trim(),
      email: campoEmail.input.value.trim(),
    };
  }

  return { corpo, lerDados };
}

/** Completo = tudo preenchido, exceto complemento (muitos endereços reais legitimamente não têm). */
export function estaCompleto(dados) {
  return (
    ehCampoObrigatorio(dados.nome) &&
    ehCampoObrigatorio(dados.oab) &&
    ehCampoObrigatorio(dados.telefone) &&
    ehCampoObrigatorio(dados.email) &&
    ehCampoObrigatorio(dados.endereco.rua) &&
    ehCampoObrigatorio(dados.endereco.numero) &&
    ehCampoObrigatorio(dados.endereco.bairro) &&
    ehCampoObrigatorio(dados.endereco.cidade) &&
    ehCampoObrigatorio(dados.endereco.estado)
  );
}

/**
 * Modal de edição — usado tanto para completar um cadastro pré-importado
 * quanto para corrigir um já completo, e para cadastrar um advogado novo
 * (`oabOriginal` nulo, OAB fica editável). Primeiro clique em "Salvar" só
 * valida; um segundo clique (com o aviso de confirmação visível) grava de
 * verdade, sempre marcando `completo: true`.
 * @param {{ oabOriginal: string|null, dadosIniciais: object, perfilUsuario: object, onSalvo: (oabFinal: string) => void }} params
 */
export function abrirModalEdicao({ oabOriginal, dadosIniciais, perfilUsuario, onSalvo }) {
  const oabEditavel = !oabOriginal;
  const { corpo, lerDados } = criarCamposCadastro(dadosIniciais ?? {}, { oabEditavel });

  const avisoConfirmacao = criarElemento('p', { class: 'advogados__aviso-confirmacao' }, [
    'Você confirma que todos os dados estão corretos? Depois de salvar, este cadastro não pede mais complementação — para ninguém.',
  ]);
  avisoConfirmacao.style.display = 'none';

  const botaoSalvar = criarBotao({ texto: 'Salvar', icon: 'check' });
  let aguardandoConfirmacao = false;

  const fechar = abrirModal({
    titulo: oabOriginal ? `Editar cadastro — ${dadosIniciais?.nome ?? oabOriginal}` : 'Adicionar advogado',
    conteudo: [
      criarElemento('p', { class: 'text-muted' }, [
        'Todos os campos são obrigatórios, exceto complemento.',
      ]),
      ...corpo,
      avisoConfirmacao,
    ],
    rodape: [botaoSalvar],
  });

  botaoSalvar.addEventListener('click', async () => {
    const dados = lerDados();
    if (!estaCompleto(dados)) {
      aguardandoConfirmacao = false;
      avisoConfirmacao.style.display = 'none';
      botaoSalvar.querySelector('span:last-child').textContent = 'Salvar';
      mostrarToast('Preencha nome, OAB, telefone, e-mail e o endereço (rua, número, bairro, cidade, estado).', 'aviso');
      return;
    }

    if (!aguardandoConfirmacao) {
      aguardandoConfirmacao = true;
      avisoConfirmacao.style.display = '';
      botaoSalvar.querySelector('span:last-child').textContent = 'Confirmar e salvar';
      return;
    }

    const oabFinal = oabEditavel ? dados.oab : oabOriginal;
    botaoSalvar.disabled = true;
    try {
      await criarOuAtualizar(oabFinal, {
        ...dados,
        completo: true,
        atualizadoPor: perfilUsuario?.nome ?? usuarioAtual()?.email ?? '—',
      });
      mostrarToast('Cadastro salvo.', 'sucesso');
      fechar();
      onSalvo?.(oabFinal);
    } catch (erro) {
      console.error('Falha ao salvar cadastro de advogado:', erro);
      mostrarToast('Não foi possível salvar o cadastro.', 'erro');
      botaoSalvar.disabled = false;
    }
  });
}
