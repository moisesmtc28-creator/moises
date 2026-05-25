import { useEffect, useMemo, useState } from 'react';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';

import { auth, db } from './firebase';

import AlunoHeader from './components/AlunoHeader';
import StatsCards from './components/StatsCards';

type TipoUsuario = 'admin' | 'professor' | 'aluno';
type StatusUsuario = 'pendente' | 'aprovado' | 'bloqueado';

type Perfil = {
  uid: string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  status?: StatusUsuario;
  primeiroAcesso?: boolean;
  professorEmail?: string;
  dataAtivacao?: string;
  aprovadoPor?: string;
  foto?: string;
  formacao?: string;
  especialidade?: string;
  cref?: string;
  descricao?: string;
};

type ConfigSistema = {
  whatsapp: string;
  email: string;
  textoContato: string;
  admins: string[];
};

type AvaliacaoFisica = {
  id: string;
  data: string;
  peso: string;
  altura: string;
  cintura: string;
  quadril: string;
  torax: string;
  braco: string;
  coxa: string;
  gordura: string;
  massaMagra: string;
  imc: string;
  observacoes: string;
};

type Aluno = {
  id: string;
  uid?: string;
  nome: string;
  email: string;
  foto?: string;
  professorEmail: string;
  criadoEm?: any;
  avaliacoes?: AvaliacaoFisica[];
};

type Exercicio = {
  id: string;
  nome: string;
  series: string;
  repeticoes: string;
  descanso: string;
  cargaSugerida: string;
  metodo: string;
  velocidade: string;
  video: string;
  obsProfessor: string;
  obsAluno: string;
  cargaAtual: string;
  ultimaCarga: string;
  seriesConcluidas: number[];
  finalizado: boolean;
  ordem: number;
  historicoCargas: { carga: string; data: string }[];
};

type Treino = {
  id: string;
  nome: string;
  dataTreino?: string;
  alunoId: string;
  alunoNome: string;
  alunoEmail: string;
  professorEmail: string;
  exercicios: Exercicio[];
  mensagens: { texto: string; autor: string; data: string }[];
  criadoEm?: any;
};

type ModeloExercicio = Exercicio & {
  professorEmail: string;
  criadoEm?: any;
};

const CACHE_TREINOS = 'evotrain_cache_treinos_v2';
const uid = () => Date.now().toString() + Math.random().toString(16).slice(2);

// Coloque aqui o e-mail administrador do sistema.
const ADMIN_EMAILS = ['moisesmtc28@gmail.com', 'moisesthadeu@live.com'].map(
  (email) => email.toLowerCase()
);

export default function App() {
  const [usuario, setUsuario] = useState<any>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [usuariosSistema, setUsuariosSistema] = useState<Perfil[]>([]);
  const [treinos, setTreinos] = useState<Treino[]>(() => {
    const cache = localStorage.getItem(CACHE_TREINOS);
    return cache ? JSON.parse(cache) : [];
  });
  const [modelosExercicios, setModelosExercicios] = useState<ModeloExercicio[]>([]);

  const [novoAlunoNome, setNovoAlunoNome] = useState('');
  const [novoAlunoEmail, setNovoAlunoEmail] = useState('');
  const [novoAlunoSenha, setNovoAlunoSenha] = useState('');
  const [novoAlunoFoto, setNovoAlunoFoto] = useState('');

  const [alunoSelecionado, setAlunoSelecionado] = useState('');
  const [nomeTreino, setNomeTreino] = useState('');
  const [dataTreino, setDataTreino] = useState('');
  const [treinoAbertoId, setTreinoAbertoId] = useState('');
  const [mensagem, setMensagem] = useState('');

  const [online, setOnline] = useState(navigator.onLine);
  const [notificacoes, setNotificacoes] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const [timerAtivo, setTimerAtivo] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [timerInfo, setTimerInfo] = useState('Descanso');
  const [somTimer, setSomTimer] = useState<'padrao' | 'sino' | 'eletronico' | 'vitoria'>(() => {
    return (localStorage.getItem('evotrain_som_timer') as any) || 'padrao';
  });

  const [dragExercicioId, setDragExercicioId] = useState('');
  const [exercicioAbertoId, setExercicioAbertoId] = useState('');
  const [novoExercicioDraft, setNovoExercicioDraft] =
    useState<Exercicio | null>(null);
  const [abaProfessor, setAbaProfessor] = useState<'treinos' | 'alunos'>(
    'treinos'
  );
  const [novaSenhaPrimeiroAcesso, setNovaSenhaPrimeiroAcesso] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<'inicio' | 'treinos' | 'estatisticas' | 'avaliacoes' | 'mensagens' | 'configuracoes' | 'perfil'>('inicio');
  const [menuLateralAberto, setMenuLateralAberto] = useState(false);

  const [configSistema, setConfigSistema] = useState<ConfigSistema>({
    whatsapp: '37991231408',
    email: 'moisesmtc28@gmail.com',
    textoContato: 'Adquira o EvoTrain',
    admins: ['moisesmtc28@gmail.com'],
  });

  const [novoAdminEmail, setNovoAdminEmail] = useState('');

  const [alunoDashId, setAlunoDashId] = useState('');
  const [avaliacaoDraft, setAvaliacaoDraft] = useState<AvaliacaoFisica>({
    id: '',
    data: new Date().toISOString().slice(0, 10),
    peso: '',
    altura: '',
    cintura: '',
    quadril: '',
    torax: '',
    braco: '',
    coxa: '',
    gordura: '',
    massaMagra: '',
    imc: '',
    observacoes: '',
  });

  const adminEmailsAtivos = useMemo(() => {
    const listaConfig = (configSistema.admins || []).map((email) =>
      email.toLowerCase().trim()
    );

    return Array.from(new Set([...ADMIN_EMAILS, ...listaConfig]));
  }, [configSistema.admins]);

  const isAdmin =
    !!perfil?.email && adminEmailsAtivos.includes(perfil.email.toLowerCase());

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);

    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    carregarConfigSistema();

    const unsub = onAuthStateChanged(auth, async (user) => {
      setUsuario(user);

      if (user) {
        await carregarPerfil(user);
      } else {
        setPerfil(null);
        setAlunos([]);
        setTreinos([]);
        setModelosExercicios([]);
        setUsuariosSistema([]);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (usuario && perfil) {
      carregarTudo();
    }
  }, [usuario, perfil]);

  useEffect(() => {
    localStorage.setItem(CACHE_TREINOS, JSON.stringify(treinos));
  }, [treinos]);

  useEffect(() => {
    localStorage.setItem('evotrain_som_timer', somTimer);
  }, [somTimer]);

  useEffect(() => {
    if (!timerAtivo) return;

    if (tempoRestante <= 0) {
      setTimerAtivo(false);

      setTimeout(() => {
        tocarSomProfissional();
      }, 100);

      try {
        if ('vibrate' in navigator) {
          navigator.vibrate([250, 120, 250]);
        }
      } catch {}

      return;
    }

    const t = setTimeout(() => setTempoRestante((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timerAtivo, tempoRestante]);

  const alunoSelecionadoObj = useMemo(
    () => alunos.find((aluno) => aluno.id === alunoSelecionado),
    [alunos, alunoSelecionado]
  );

  const treinosVisiveis = useMemo(() => {
    if (perfil?.tipo === 'professor') {
      if (!alunoSelecionadoObj) return [];

      return treinos.filter(
        (treino) =>
          treino.alunoId === alunoSelecionadoObj.id ||
          treino.alunoEmail === alunoSelecionadoObj.email
      );
    }

    return treinos;
  }, [treinos, perfil, alunoSelecionadoObj]);

  const treinosOrdenados = useMemo(
    () =>
      [...treinosVisiveis].sort((a, b) =>
        (a.nome || '').localeCompare(b.nome || '')
      ),
    [treinosVisiveis]
  );

  useEffect(() => {
    if (treinosOrdenados.length === 0) {
      if (treinoAbertoId) setTreinoAbertoId('');
      return;
    }

    const treinoAtualPertenceAoAluno = treinosOrdenados.some(
      (treino) => treino.id === treinoAbertoId
    );

    if (!treinoAbertoId || !treinoAtualPertenceAoAluno) {
      setTreinoAbertoId(treinosOrdenados[0].id);
    }
  }, [treinosOrdenados, treinoAbertoId]);

  async function carregarConfigSistema() {
    try {
      const ref = doc(db, 'configuracoes', 'sistema');
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const dados = snap.data() as Partial<ConfigSistema>;

        setConfigSistema({
          whatsapp: dados.whatsapp || '37991231408',
          email: dados.email || 'moisesmtc28@gmail.com',
          textoContato: dados.textoContato || 'Adquira o EvoTrain',
          admins: Array.from(
            new Set(
              [
                'moisesmtc28@gmail.com',
                ...((dados.admins || []) as string[]),
              ].map((email) => email.toLowerCase().trim())
            )
          ),
        });
        return;
      }

      await setDoc(ref, configSistema);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }

  async function salvarConfigSistema() {
    try {
      await setDoc(
        doc(db, 'configuracoes', 'sistema'),
        {
          ...configSistema,
          admins: Array.from(
            new Set(
              ['moisesmtc28@gmail.com', ...(configSistema.admins || [])].map(
                (email) => email.toLowerCase().trim()
              )
            )
          ),
        },
        { merge: true }
      );

      alert('Contato salvo com sucesso.');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar contato.');
    }
  }

  async function carregarPerfil(user: any) {
    const ref = doc(db, 'usuarios', user.uid);
    const snap = await getDoc(ref);
    const emailUsuario = String(user.email || '').toLowerCase();
    const ehAdmin = ADMIN_EMAILS.includes(emailUsuario);

    if (snap.exists()) {
      const dados = snap.data() as Perfil;

      if (ehAdmin && dados.tipo !== 'admin') {
        const perfilAdmin = {
          ...dados,
          uid: user.uid,
          tipo: 'admin' as TipoUsuario,
          status: 'aprovado' as StatusUsuario,
          primeiroAcesso: false,
        };

        await setDoc(ref, perfilAdmin, { merge: true });
        setPerfil(perfilAdmin);
        return;
      }

      setPerfil(dados);
      return;
    }

    const novoPerfil: Perfil = {
      uid: user.uid,
      nome: user.email || '',
      email: user.email || '',
      tipo: ehAdmin ? 'admin' : 'aluno',
      status: 'aprovado',
      primeiroAcesso: false,
      foto: '',
      formacao: '',
      especialidade: '',
      cref: '',
      descricao: '',
    };

    await setDoc(ref, novoPerfil);
    setPerfil(novoPerfil);
  }

  async function carregarTudo() {
    if (!usuario || !perfil) return;

    if (isAdmin) {
      const usuariosSnap = await getDocs(collection(db, 'usuarios'));
      const listaUsuarios = usuariosSnap.docs.map((d) => {
        const dados = d.data() as any;
        return {
          uid: d.id,
          ...dados,
        } as Perfil;
      });

      setUsuariosSistema(listaUsuarios);
    }

    let qAlunos: any;

    if (perfil.tipo === 'professor') {
      qAlunos = query(
        collection(db, 'alunos'),
        where('professorEmail', '==', usuario.email)
      );
    } else if (perfil.tipo === 'aluno') {
      qAlunos = query(
        collection(db, 'alunos'),
        where('email', '==', usuario.email)
      );
    } else {
      qAlunos = collection(db, 'alunos');
    }

    const alunosSnap = await getDocs(qAlunos);
    const listaAlunos = alunosSnap.docs.map((d) => {
      const dados = d.data() as any;
      return {
        id: d.id,
        ...dados,
      } as Aluno;
    });

    setAlunos(listaAlunos);

    const treinosRef = collection(db, 'treinos');
    let qTreinos: any;

    if (perfil.tipo === 'professor') {
      qTreinos = query(
        treinosRef,
        where('professorEmail', '==', usuario.email)
      );
    } else if (perfil.tipo === 'aluno') {
      qTreinos = query(treinosRef, where('alunoEmail', '==', usuario.email));
    } else {
      qTreinos = treinosRef;
    }

    const treinosSnap = await getDocs(qTreinos);
    const listaTreinos = treinosSnap.docs.map((d) => {
      const dados = d.data() as any;
      return {
        id: d.id,
        ...dados,
      } as Treino;
    });

    setTreinos(listaTreinos);

    if (perfil.tipo === 'professor') {
      const modelosSnap = await getDocs(
        query(
          collection(db, 'modelosExercicios'),
          where('professorEmail', '==', usuario.email)
        )
      );

      const listaModelos = modelosSnap.docs.map((d) => {
        const dados = d.data() as any;
        return {
          id: d.id,
          ...dados,
        } as ModeloExercicio;
      });

      setModelosExercicios(
        listaModelos.sort((a, b) =>
          (a.nome || '').localeCompare(b.nome || '')
        )
      );
    } else {
      setModelosExercicios([]);
    }

    if (perfil.tipo !== 'professor' && !treinoAbertoId && listaTreinos[0]) {
      setTreinoAbertoId(listaTreinos[0].id);
    }
  }

  async function cadastrar() {
    try {
      if (!email.includes('@')) return alert('Digite um e-mail válido.');
      if (senha.length < 6) {
        return alert('A senha precisa ter no mínimo 6 caracteres.');
      }

      const cred = await createUserWithEmailAndPassword(auth, email, senha);

      const novoPerfil: Perfil = {
        uid: cred.user.uid,
        nome: email,
        email,
        tipo: 'professor',
        status: 'pendente',
        primeiroAcesso: false,
        foto: '',
        formacao: '',
        especialidade: '',
        cref: '',
        descricao: '',
      };

      await setDoc(doc(db, 'usuarios', cred.user.uid), novoPerfil);
      alert('Solicitação enviada. Aguarde aprovação do administrador.');
    } catch (e: any) {
      alert(traduzErro(e.message));
    }
  }

  async function entrar() {
    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch (e: any) {
      alert(traduzErro(e.message));
    }
  }

  async function recuperarSenha() {
    try {
      if (!email.includes('@')) {
        return alert('Digite seu e-mail para recuperar a senha.');
      }

      await sendPasswordResetEmail(auth, email);
      alert('E-mail de recuperação enviado.');
    } catch (e: any) {
      alert(traduzErro(e.message));
    }
  }

  async function sair() {
    await signOut(auth);
    setPerfil(null);
  }

  async function salvarPerfil() {
    if (!perfil) return;

    await updateDoc(doc(db, 'usuarios', perfil.uid), perfil as any);
    alert('Perfil salvo!');
  }

  async function aprovarProfessor(professor: Perfil) {
    await updateDoc(doc(db, 'usuarios', professor.uid), {
      status: 'aprovado',
      dataAtivacao: professor.dataAtivacao || new Date().toLocaleString(),
      aprovadoPor: perfil?.email || '',
    });

    alert('Professor aprovado.');
    carregarTudo();
  }

  async function bloquearProfessor(professor: Perfil) {
    if (!confirm(`Bloquear professor ${professor.email}?`)) return;

    await updateDoc(doc(db, 'usuarios', professor.uid), {
      status: 'bloqueado',
    });

    alert('Professor bloqueado.');
    carregarTudo();
  }

  async function adicionarAdmin() {
    const emailNovoAdmin = novoAdminEmail.trim().toLowerCase();

    if (!emailNovoAdmin.includes('@')) {
      alert('Digite um e-mail válido.');
      return;
    }

    const admins = Array.from(
      new Set(
        [
          'moisesmtc28@gmail.com',
          ...(configSistema.admins || []),
          emailNovoAdmin,
        ].map((email) => email.toLowerCase().trim())
      )
    );

    const novaConfig = {
      ...configSistema,
      admins,
    };

    setConfigSistema(novaConfig);

    await setDoc(doc(db, 'configuracoes', 'sistema'), novaConfig, {
      merge: true,
    });

    setNovoAdminEmail('');
    alert('Administrador adicionado.');
  }

  async function removerAdmin(emailAdmin: string) {
    const emailNormalizado = emailAdmin.toLowerCase().trim();

    if (emailNormalizado === 'moisesmtc28@gmail.com') {
      alert('O administrador principal não pode ser removido pelo sistema.');
      return;
    }

    if (!confirm(`Remover ${emailAdmin} dos administradores?`)) return;

    const admins = (configSistema.admins || []).filter(
      (email) => email.toLowerCase().trim() !== emailNormalizado
    );

    const novaConfig = {
      ...configSistema,
      admins,
    };

    setConfigSistema(novaConfig);

    await setDoc(doc(db, 'configuracoes', 'sistema'), novaConfig, {
      merge: true,
    });

    alert('Administrador removido.');
  }

  function professoresResumoAdmin() {
    return usuariosSistema
      .filter((u) => u.tipo === 'professor')
      .map((professor) => {
        const alunosProfessor = alunos.filter(
          (aluno) =>
            aluno.professorEmail?.toLowerCase() ===
            professor.email?.toLowerCase()
        );

        return {
          professor,
          alunosProfessor,
          quantidadeAlunos: alunosProfessor.length,
        };
      });
  }

  async function cadastrarAluno() {
    if (!usuario) return;

    if (!novoAlunoNome || !novoAlunoEmail.includes('@')) {
      alert('Preencha nome e e-mail válido do aluno.');
      return;
    }

    if (novoAlunoSenha.length < 6) {
      alert('Digite uma senha provisória com no mínimo 6 caracteres.');
      return;
    }

    try {
      const apiKey = (auth.app.options as any).apiKey;

      const resposta = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: novoAlunoEmail,
            password: novoAlunoSenha,
            returnSecureToken: false,
          }),
        }
      );

      const dadosAuth = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dadosAuth?.error?.message || 'Erro ao criar login do aluno.'
        );
      }

      const alunoUid = dadosAuth.localId;

      await setDoc(doc(db, 'usuarios', alunoUid), {
        uid: alunoUid,
        nome: novoAlunoNome,
        email: novoAlunoEmail,
        tipo: 'aluno',
        status: 'aprovado',
        primeiroAcesso: true,
        professorEmail: usuario.email,
        foto: novoAlunoFoto,
      });

      await addDoc(collection(db, 'alunos'), {
        uid: alunoUid,
        nome: novoAlunoNome,
        email: novoAlunoEmail,
        foto: novoAlunoFoto,
        professorEmail: usuario.email,
        criadoEm: new Date(),
      });

      setNovoAlunoNome('');
      setNovoAlunoEmail('');
      setNovoAlunoSenha('');
      setNovoAlunoFoto('');

      alert(
        'Aluno criado com senha provisória. No primeiro acesso ele será obrigado a trocar a senha.'
      );

      carregarTudo();
    } catch (e: any) {
      alert(traduzErro(e.message));
    }
  }

  async function excluirAluno(aluno: Aluno) {
    if (!usuario) return;

    const confirmar = confirm(
      `Deseja excluir o aluno ${aluno.nome}? Os treinos dele também serão excluídos.`
    );

    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, 'alunos', aluno.id));

      if (aluno.uid) {
        await updateDoc(doc(db, 'usuarios', aluno.uid), {
          status: 'bloqueado',
        });
      }

      const qTreinosAluno = query(
        collection(db, 'treinos'),
        where('professorEmail', '==', usuario.email),
        where('alunoEmail', '==', aluno.email)
      );

      const snap = await getDocs(qTreinosAluno);

      await Promise.all(
        snap.docs.map((documento) =>
          deleteDoc(doc(db, 'treinos', documento.id))
        )
      );

      if (alunoSelecionado === aluno.id) {
        setAlunoSelecionado('');
        setTreinoAbertoId('');
      }

      carregarTudo();
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir aluno.');
    }
  }

  async function editarEmailAluno(aluno: Aluno) {
    const novoEmail = prompt('Digite o novo e-mail do aluno:', aluno.email);

    if (!novoEmail || !novoEmail.includes('@')) {
      alert('E-mail inválido.');
      return;
    }

    try {
      await updateDoc(doc(db, 'alunos', aluno.id), {
        email: novoEmail,
      });

      if (aluno.uid) {
        await updateDoc(doc(db, 'usuarios', aluno.uid), {
          email: novoEmail,
        });
      }

      const qTreinosAluno = query(
        collection(db, 'treinos'),
        where('alunoEmail', '==', aluno.email)
      );

      const snap = await getDocs(qTreinosAluno);

      await Promise.all(
        snap.docs.map((documento) =>
          updateDoc(doc(db, 'treinos', documento.id), {
            alunoEmail: novoEmail,
          })
        )
      );

      alert(
        'E-mail alterado no cadastro do app. Para alterar também o e-mail de login do Firebase Auth, use Firebase Functions/Admin SDK.'
      );

      carregarTudo();
    } catch (error) {
      console.error(error);
      alert('Erro ao editar e-mail do aluno.');
    }
  }

  async function zerarDadosProfessor() {
    if (!usuario) return;

    const confirmacao = prompt(
      'Isso vai apagar TODOS os alunos e TODOS os treinos deste professor. Digite ZERAR para confirmar.'
    );

    if (confirmacao !== 'ZERAR') return;

    try {
      const qAlunosProfessor = query(
        collection(db, 'alunos'),
        where('professorEmail', '==', usuario.email)
      );

      const qTreinosProfessor = query(
        collection(db, 'treinos'),
        where('professorEmail', '==', usuario.email)
      );

      const [alunosSnap, treinosSnap] = await Promise.all([
        getDocs(qAlunosProfessor),
        getDocs(qTreinosProfessor),
      ]);

      await Promise.all([
        ...alunosSnap.docs.map((documento) =>
          deleteDoc(doc(db, 'alunos', documento.id))
        ),
        ...treinosSnap.docs.map((documento) =>
          deleteDoc(doc(db, 'treinos', documento.id))
        ),
      ]);

      setAlunos([]);
      setTreinos([]);
      setAlunoSelecionado('');
      setTreinoAbertoId('');

      alert('Banco zerado para este professor.');
      carregarTudo();
    } catch (error) {
      console.error(error);
      alert('Erro ao zerar o banco de dados.');
    }
  }

  async function criarTreino() {
    if (!usuario) return;

    if (!alunoSelecionado || !nomeTreino) {
      return alert('Selecione o aluno e informe o nome do treino.');
    }

    const aluno = alunos.find((a) => a.id === alunoSelecionado);

    if (!aluno) {
      alert('Aluno não encontrado.');
      return;
    }

    const ref = await addDoc(collection(db, 'treinos'), {
      nome: nomeTreino,
      dataTreino,
      alunoId: aluno.id,
      alunoNome: aluno.nome,
      alunoEmail: aluno.email,
      professorEmail: usuario.email,
      exercicios: [],
      mensagens: [],
      criadoEm: new Date(),
    });

    setTreinoAbertoId(ref.id);
    setNomeTreino('');
    setDataTreino('');
    carregarTudo();
  }

  async function excluirTreino(id: string) {
    if (!confirm('Excluir treino completo?')) return;

    await deleteDoc(doc(db, 'treinos', id));
    setTreinoAbertoId('');
    carregarTudo();
  }

  function adicionarExercicio() {
    const novo: Exercicio = {
      id: uid(),
      nome: '',
      series: '',
      repeticoes: '',
      descanso: '',
      cargaSugerida: '',
      metodo: '',
      velocidade: '',
      video: '',
      obsProfessor: '',
      obsAluno: '',
      cargaAtual: '',
      ultimaCarga: '',
      seriesConcluidas: [],
      finalizado: false,
      ordem: -1,
      historicoCargas: [],
    };

    setNovoExercicioDraft(novo);
    setExercicioAbertoId(novo.id);
  }

  function atualizarNovoExercicio(campo: keyof Exercicio, valor: any) {
    if (!novoExercicioDraft) return;

    setNovoExercicioDraft({
      ...novoExercicioDraft,
      [campo]: valor,
    });
  }

  async function salvarNovoExercicio(treino: Treino) {
    if (!novoExercicioDraft) return;

    if (!novoExercicioDraft.nome.trim()) {
      alert('Digite o nome do exercício.');
      return;
    }

    const novo: Exercicio = {
      ...novoExercicioDraft,
      ordem: 0,
    };

    await salvarExercicios(treino, [novo, ...(treino.exercicios || [])]);

    setNovoExercicioDraft(null);
    setExercicioAbertoId('');
  }

  async function salvarExercicioComoModelo(exercicio: Exercicio) {
    if (!usuario) return;

    if (!exercicio.nome?.trim()) {
      alert('Digite o nome do exercício antes de salvar como modelo.');
      return;
    }

    await addDoc(collection(db, 'modelosExercicios'), {
      ...exercicio,
      id: uid(),
      professorEmail: usuario.email,
      seriesConcluidas: [],
      finalizado: false,
      cargaAtual: '',
      ultimaCarga: '',
      historicoCargas: [],
      criadoEm: new Date(),
    });

    alert('Exercício salvo nos seus modelos.');
    carregarTudo();
  }

  async function usarModeloExercicio(treino: Treino, modelo: ModeloExercicio) {
    const novo: Exercicio = {
      id: uid(),
      nome: modelo.nome || '',
      series: modelo.series || '',
      repeticoes: modelo.repeticoes || '',
      descanso: modelo.descanso || '',
      cargaSugerida: modelo.cargaSugerida || '',
      metodo: modelo.metodo || '',
      velocidade: modelo.velocidade || '',
      video: modelo.video || '',
      obsProfessor: modelo.obsProfessor || '',
      obsAluno: '',
      cargaAtual: '',
      ultimaCarga: '',
      seriesConcluidas: [],
      finalizado: false,
      ordem: 0,
      historicoCargas: [],
    };

    await salvarExercicios(treino, [novo, ...(treino.exercicios || [])]);
  }

  async function excluirModeloExercicio(modeloId: string) {
    if (!confirm('Excluir este modelo de exercício?')) return;

    await deleteDoc(doc(db, 'modelosExercicios', modeloId));
    carregarTudo();
  }

  async function salvarExercicios(treino: Treino, exercicios: Exercicio[]) {
    const atualizados = exercicios.map((e, index) => ({
      ...e,
      ordem: index,
    }));

    setTreinos((prev) =>
      prev.map((t) =>
        t.id === treino.id ? { ...t, exercicios: atualizados } : t
      )
    );

    await updateDoc(doc(db, 'treinos', treino.id), {
      exercicios: atualizados,
    });

    carregarTudo();
  }

  async function atualizarExercicio(
    treino: Treino,
    exId: string,
    campo: keyof Exercicio,
    valor: any
  ) {
    const exercicios = (treino.exercicios || []).map((ex) =>
      ex.id === exId ? { ...ex, [campo]: valor } : ex
    );

    await salvarExercicios(treino, exercicios);
  }

  async function excluirExercicio(treino: Treino, exId: string) {
    const exercicios = (treino.exercicios || []).filter((ex) => ex.id !== exId);
    await salvarExercicios(treino, exercicios);
  }

  async function marcarSerie(treino: Treino, ex: Exercicio, serie: number) {
    const atuais = ex.seriesConcluidas || [];
    const novas = atuais.includes(serie)
      ? atuais.filter((s) => s !== serie)
      : [...atuais, serie];

    const exercicios = treino.exercicios.map((e) =>
      e.id === ex.id ? { ...e, seriesConcluidas: novas } : e
    );

    await salvarExercicios(treino, exercicios);
    iniciarDescanso(Number(ex.descanso) || 60, `${ex.nome} - descanso`);
  }

  async function finalizarExercicio(treino: Treino, ex: Exercicio) {
    const todasSeries = Array.from(
      { length: Number(ex.series) || 0 },
      (_, i) => i + 1
    );

    const carga = ex.cargaAtual || ex.ultimaCarga || '';

    const exercicios = treino.exercicios.map((e) =>
      e.id === ex.id
        ? {
            ...e,
            seriesConcluidas: todasSeries,
            finalizado: true,
            ultimaCarga: carga,
            cargaAtual: carga,
            historicoCargas: carga
              ? [
                  ...(e.historicoCargas || []),
                  { carga, data: new Date().toLocaleString() },
                ]
              : e.historicoCargas || [],
          }
        : e
    );

    await salvarExercicios(treino, exercicios);
  }

  async function reiniciarTreino(treino: Treino) {
    const exercicios = (treino.exercicios || []).map((e) => ({
      ...e,
      finalizado: false,
      seriesConcluidas: [],
      cargaAtual: e.ultimaCarga || '',
    }));

    await salvarExercicios(treino, exercicios);
  }

  async function enviarMensagem(treino: Treino) {
    if (!mensagem) return;

    const nova = {
      texto: mensagem,
      autor:
        perfil?.tipo === 'professor' ? 'Professor' : perfil?.nome || 'Aluno',
      data: new Date().toLocaleString(),
    };

    await updateDoc(doc(db, 'treinos', treino.id), {
      mensagens: [...(treino.mensagens || []), nova],
    });

    setMensagem('');
    carregarTudo();
  }

  async function solicitarNotificacoes() {
    if (typeof Notification === 'undefined') return;

    const permissao = await Notification.requestPermission();
    setNotificacoes(permissao);
  }


  function iniciarDescanso(segundos: number, info = 'Descanso') {
    setTimerInfo(info);
    setTempoRestante(segundos);
    setTimerAtivo(true);
  }

  async function tocarSomProfissional() {
    try {
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;

      if (!AudioCtx) return;

      const ctx = new AudioCtx();

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const sequencias: Record<typeof somTimer, number[]> = {
        padrao: [880],
        sino: [660, 880],
        eletronico: [440, 660, 880],
        vitoria: [523, 659, 784, 1046],
      };

      const notas = sequencias[somTimer] || sequencias.padrao;

      notas.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = somTimer === 'eletronico' ? 'square' : 'sine';
        oscillator.frequency.value = freq;

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        const inicio = ctx.currentTime + index * 0.18;
        const fim = inicio + 0.15;

        gain.gain.setValueAtTime(0.001, inicio);
        gain.gain.exponentialRampToValueAtTime(0.25, inicio + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, fim);

        oscillator.start(inicio);
        oscillator.stop(fim);
      });

      setTimeout(() => {
        ctx.close().catch(() => {});
      }, notas.length * 250 + 500);
    } catch (error) {
      console.warn('Erro ao tocar som:', error);
    }
  }

  async function moverExercicio(treino: Treino, destinoId: string) {
    if (!dragExercicioId || dragExercicioId === destinoId) return;

    const lista = [...(treino.exercicios || [])].sort(
      (a, b) => (a.ordem || 0) - (b.ordem || 0)
    );

    const origemIndex = lista.findIndex((e) => e.id === dragExercicioId);
    const destinoIndex = lista.findIndex((e) => e.id === destinoId);

    if (origemIndex < 0 || destinoIndex < 0) return;

    const [removido] = lista.splice(origemIndex, 1);
    lista.splice(destinoIndex, 0, removido);

    setDragExercicioId('');
    await salvarExercicios(treino, lista);
  }

  function lerImagemLocal(e: any, callback: (valor: string) => void) {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      callback(String(reader.result));
    };

    reader.readAsDataURL(file);
  }

  function alterarNomeTreinoLocal(treinoId: string, novoNome: string) {
    setTreinos((prev) =>
      prev.map((t) => (t.id === treinoId ? { ...t, nome: novoNome } : t))
    );
  }

  async function salvarNomeTreino(treino: Treino) {
    if (!treino.nome.trim()) {
      alert('Digite o nome do treino.');
      return;
    }

    await updateDoc(doc(db, 'treinos', treino.id), {
      nome: treino.nome,
    });

    alert('Nome do treino salvo!');
    carregarTudo();
  }

  function progressoAluno(aluno: Aluno) {
    const treinosAluno = treinos.filter(
      (treino) =>
        treino.alunoId === aluno.id || treino.alunoEmail === aluno.email
    );

    const totalExercicios = treinosAluno.reduce(
      (total, treino) => total + (treino.exercicios?.length || 0),
      0
    );

    const concluidos = treinosAluno.reduce(
      (total, treino) =>
        total +
        (treino.exercicios || []).filter((exercicio) => exercicio.finalizado)
          .length,
      0
    );

    const progresso = totalExercicios
      ? Math.round((concluidos / totalExercicios) * 100)
      : 0;

    return {
      treinos: treinosAluno.length,
      totalExercicios,
      concluidos,
      progresso,
    };
  }

  function alunoDashboard(aluno: Aluno) {
    const treinosAluno = treinos.filter(
      (treino) =>
        treino.alunoId === aluno.id || treino.alunoEmail === aluno.email
    );

    const exercicios = treinosAluno.flatMap((treino) =>
      (treino.exercicios || []).map((exercicio) => ({
        ...exercicio,
        treinoNome: treino.nome,
        treinoData: treino.dataTreino || '',
      }))
    );

    const totalExercicios = exercicios.length;
    const concluidos = exercicios.filter(
      (exercicio) => exercicio.finalizado
    ).length;
    const progresso = totalExercicios
      ? Math.round((concluidos / totalExercicios) * 100)
      : 0;

    const cargas = exercicios.flatMap((exercicio) =>
      (exercicio.historicoCargas || []).map((item) => ({
        exercicio: exercicio.nome,
        treino: exercicio.treinoNome,
        carga: item.carga,
        data: item.data,
      }))
    );

    const timeline = [
      ...treinosAluno.map((treino) => ({
        data: treino.dataTreino || 'Sem data',
        tipo: 'Treino',
        titulo: treino.nome,
        detalhe: `${
          (treino.exercicios || []).filter((e) => e.finalizado).length
        }/${(treino.exercicios || []).length} exercícios concluídos`,
      })),
      ...cargas.map((item) => ({
        data: item.data,
        tipo: 'Carga',
        titulo: item.exercicio,
        detalhe: `${item.carga} - ${item.treino}`,
      })),
      ...(aluno.avaliacoes || []).map((avaliacao) => ({
        data: avaliacao.data,
        tipo: 'Avaliação',
        titulo: 'Avaliação física',
        detalhe: `Peso ${avaliacao.peso || '-'} kg | Gordura ${
          avaliacao.gordura || '-'
        }% | Massa magra ${avaliacao.massaMagra || '-'} kg`,
      })),
    ];

    return {
      treinosAluno,
      exercicios,
      totalExercicios,
      concluidos,
      progresso,
      cargas,
      timeline,
      avaliacoes: aluno.avaliacoes || [],
    };
  }

  function calcularIMC(peso: string, altura: string) {
    const p = Number(String(peso).replace(',', '.'));
    let a = Number(String(altura).replace(',', '.'));

    if (!p || !a) return '';

    if (a > 3) a = a / 100;

    return (p / (a * a)).toFixed(1);
  }

  function atualizarAvaliacao(campo: keyof AvaliacaoFisica, valor: string) {
    const novo = {
      ...avaliacaoDraft,
      [campo]: valor,
    };

    if (campo === 'peso' || campo === 'altura') {
      novo.imc = calcularIMC(
        campo === 'peso' ? valor : novo.peso,
        campo === 'altura' ? valor : novo.altura
      );
    }

    setAvaliacaoDraft(novo);
  }

  async function salvarAvaliacaoAluno(aluno: Aluno) {
    const nova: AvaliacaoFisica = {
      ...avaliacaoDraft,
      id: avaliacaoDraft.id || uid(),
      data: avaliacaoDraft.data || new Date().toISOString().slice(0, 10),
    };

    const avaliacoes = [
      nova,
      ...(aluno.avaliacoes || []).filter((a) => a.id !== nova.id),
    ];

    await updateDoc(doc(db, 'alunos', aluno.id), {
      avaliacoes,
    });

    setAvaliacaoDraft({
      id: '',
      data: new Date().toISOString().slice(0, 10),
      peso: '',
      altura: '',
      cintura: '',
      quadril: '',
      torax: '',
      braco: '',
      coxa: '',
      gordura: '',
      massaMagra: '',
      imc: '',
      observacoes: '',
    });

    alert('Avaliação salva.');
    carregarTudo();
  }

  async function excluirAvaliacaoAluno(aluno: Aluno, avaliacaoId: string) {
    if (!confirm('Excluir esta avaliação?')) return;

    const avaliacoes = (aluno.avaliacoes || []).filter(
      (a) => a.id !== avaliacaoId
    );

    await updateDoc(doc(db, 'alunos', aluno.id), {
      avaliacoes,
    });

    carregarTudo();
  }

  function editarAvaliacao(avaliacao: AvaliacaoFisica) {
    setAvaliacaoDraft(avaliacao);
  }

  async function trocarSenhaPrimeiroAcesso() {
    if (novaSenhaPrimeiroAcesso.length < 6) {
      alert('A nova senha precisa ter no mínimo 6 caracteres.');
      return;
    }

    if (!auth.currentUser || !perfil) return;

    try {
      await updatePassword(auth.currentUser, novaSenhaPrimeiroAcesso);

      await updateDoc(doc(db, 'usuarios', perfil.uid), {
        primeiroAcesso: false,
      });

      setPerfil({ ...perfil, primeiroAcesso: false });
      setNovaSenhaPrimeiroAcesso('');
      alert('Senha alterada com sucesso.');
    } catch (error: any) {
      alert(traduzErro(error.message));
    }
  }

  if (!usuario) {
    return (
      <Page>
        <Card compacto>
          <h1 style={styles.center}>EvoTrain</h1>

          <div style={styles.contatoBox}>
            <b>{configSistema.textoContato || 'Adquira o EvoTrain'}</b>

            <div style={styles.contatoLinks}>
              <a
                href={`https://wa.me/55${configSistema.whatsapp.replace(
                  /\D/g,
                  ''
                )}`}
                target="_blank"
                rel="noreferrer"
                style={styles.contatoWhatsapp}
              >
                WhatsApp
              </a>

              <a
                href={`mailto:${configSistema.email}`}
                style={styles.contatoEmail}
              >
                E-mail
              </a>
            </div>
          </div>

          <input
            style={styles.input}
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <button style={styles.primary} onClick={entrar}>
            Entrar
          </button>

          <button style={styles.secondary} onClick={cadastrar}>
            Solicitar conta de professor
          </button>

          <button style={styles.secondary} onClick={recuperarSenha}>
            Recuperar senha
          </button>

          <p style={{ fontSize: 13 }}>
            Aluno não cria conta. O professor cria o acesso do aluno com senha
            provisória.
          </p>
        </Card>
      </Page>
    );
  }

  if (perfil?.tipo === 'professor' && perfil.status === 'pendente') {
    return (
      <Page>
        <Card compacto>
          <h1 style={styles.center}>EvoTrain</h1>
          <h2>Conta aguardando aprovação</h2>
          <p>
            Sua conta de professor foi criada, mas ainda precisa ser aprovada
            pelo administrador.
          </p>
          <button style={styles.danger} onClick={sair}>
            Sair
          </button>
        </Card>
      </Page>
    );
  }

  if (perfil?.status === 'bloqueado') {
    return (
      <Page>
        <Card compacto>
          <h1 style={styles.center}>EvoTrain</h1>
          <h2>Acesso bloqueado</h2>
          <p>Seu acesso foi bloqueado pelo administrador.</p>
          <button style={styles.danger} onClick={sair}>
            Sair
          </button>
        </Card>
      </Page>
    );
  }

  if (perfil?.tipo === 'aluno' && perfil.primeiroAcesso) {
    return (
      <Page>
        <Card compacto>
          <h1 style={styles.center}>EvoTrain</h1>
          <h2>Troque sua senha</h2>
          <p>Por segurança, troque a senha provisória antes de continuar.</p>

          <input
            style={styles.input}
            placeholder="Nova senha"
            type="password"
            value={novaSenhaPrimeiroAcesso}
            onChange={(e) => setNovaSenhaPrimeiroAcesso(e.target.value)}
          />

          <button style={styles.primary} onClick={trocarSenhaPrimeiroAcesso}>
            Salvar nova senha
          </button>

          <button style={styles.danger} onClick={sair}>
            Sair
          </button>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      {perfil && (
        <>
          <button
            style={styles.mobileMenuButton}
            onClick={() => setMenuLateralAberto(true)}
            title="Abrir menu"
          >
            ☰
          </button>

          {menuLateralAberto && (
            <div style={styles.sideOverlay} onClick={() => setMenuLateralAberto(false)}>
              <aside style={styles.sideMenu} onClick={(e) => e.stopPropagation()}>
                <div style={styles.sideHeader}>
                  <div style={styles.sideLogo}>⚡ EvoTrain</div>
                  <button style={styles.sideClose} onClick={() => setMenuLateralAberto(false)}>
                    ×
                  </button>
                </div>

                <div style={styles.sideProfile}>
                  {perfil?.foto ? (
                    <img src={perfil.foto} alt="Perfil" style={styles.sideAvatar} />
                  ) : (
                    <div style={styles.sideAvatarFallback}>👤</div>
                  )}

                  <div>
                    <b>{perfil?.nome || 'Aluno'}</b>
                    <small style={{ display: 'block', color: '#94A3B8' }}>{perfil?.email}</small>
                    <span style={online ? styles.sideOnline : styles.sideOffline}>
                      {online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                <MenuItem label="Início" icon="🏠" ativo={abaAtiva === 'inicio'} onClick={() => { setAbaAtiva('inicio'); setMenuLateralAberto(false); }} />
                <MenuItem label="Treinos" icon="🏋️" ativo={abaAtiva === 'treinos'} onClick={() => { setAbaAtiva('treinos'); setMenuLateralAberto(false); }} />
                <MenuItem label="Estatísticas" icon="📊" ativo={abaAtiva === 'estatisticas'} onClick={() => { setAbaAtiva('estatisticas'); setMenuLateralAberto(false); }} />
                <MenuItem label="Avaliações" icon="📋" ativo={abaAtiva === 'avaliacoes'} onClick={() => { setAbaAtiva('avaliacoes'); setMenuLateralAberto(false); }} />
                <MenuItem label="Mensagens" icon="💬" ativo={abaAtiva === 'mensagens'} onClick={() => { setAbaAtiva('mensagens'); setMenuLateralAberto(false); }} />
                <MenuItem label="Configurações" icon="⚙️" ativo={abaAtiva === 'configuracoes'} onClick={() => { setAbaAtiva('configuracoes'); setMenuLateralAberto(false); }} />
                <MenuItem label="Perfil" icon="👤" ativo={abaAtiva === 'perfil'} onClick={() => { setAbaAtiva('perfil'); setMenuLateralAberto(false); }} />

                <button style={styles.sideLogout} onClick={sair}>
                  Sair
                </button>
              </aside>
            </div>
          )}
        </>
      )}

      {perfil?.tipo === 'aluno' && abaAtiva === 'inicio' && (
        <>
          <AlunoHeader nome={perfil?.nome || 'Aluno'} />
          <StatsCards />
        </>
      )}
      {perfil?.tipo !== 'aluno' && (
        <div style={styles.topbar}>
          <div>
            <h1 style={{ margin: 0 }}>EvoTrain</h1>
            <small>{online ? 'Online' : 'Offline - dados em cache/sincronização'}</small>
          </div>

          <div>
            <button style={styles.secondary} onClick={solicitarNotificacoes}>
              Notificações: {notificacoes}
            </button>

            <button style={styles.danger} onClick={sair}>
              Sair
            </button>
          </div>
        </div>
      )}

      {timerAtivo && (
        <div style={styles.timerFixo}>
          <b>{timerInfo}</b> - {formatarTempo(tempoRestante)}
          <button style={styles.secondary} onClick={() => setTimerAtivo(false)}>
            Fechar
          </button>
        </div>
      )}

      {((perfil?.tipo === 'aluno' && abaAtiva === 'perfil') || perfil?.tipo !== 'aluno') && (
      <Card>
        <h2>Meu perfil</h2>

        <input
          style={styles.input}
          placeholder="Nome"
          value={perfil?.nome || ''}
          onChange={(e) =>
            setPerfil({ ...(perfil as Perfil), nome: e.target.value })
          }
        />

        <label style={styles.label}>Foto do perfil</label>

        <input
          style={styles.input}
          type="file"
          accept="image/*"
          onChange={(e) =>
            lerImagemLocal(e, (foto) =>
              setPerfil({ ...(perfil as Perfil), foto })
            )
          }
        />

        {perfil?.foto && (
          <img
            src={perfil.foto}
            alt="Foto do perfil"
            style={styles.fotoPreview}
          />
        )}

        {perfil?.tipo === 'professor' && (
          <>
            <input
              style={styles.input}
              placeholder="Formação"
              value={perfil?.formacao || ''}
              onChange={(e) =>
                setPerfil({ ...(perfil as Perfil), formacao: e.target.value })
              }
            />

            <input
              style={styles.input}
              placeholder="Especialidade"
              value={perfil?.especialidade || ''}
              onChange={(e) =>
                setPerfil({
                  ...(perfil as Perfil),
                  especialidade: e.target.value,
                })
              }
            />

            <input
              style={styles.input}
              placeholder="CREF"
              value={perfil?.cref || ''}
              onChange={(e) =>
                setPerfil({ ...(perfil as Perfil), cref: e.target.value })
              }
            />

            <textarea
              style={styles.input}
              placeholder="Descrição profissional"
              value={perfil?.descricao || ''}
              onChange={(e) =>
                setPerfil({ ...(perfil as Perfil), descricao: e.target.value })
              }
            />
          </>
        )}

        <button style={styles.primary} onClick={salvarPerfil}>
          Salvar perfil
        </button>
      </Card>
      )}

      {isAdmin && perfil?.tipo !== 'aluno' && (
        <Card>
          <h2>Administração</h2>
          <p>
            Gerencie professores, administradores e contato da tela inicial.
          </p>

          <div style={styles.dashboardGrid}>
            <div style={styles.configBox}>
              <h3>Contato da tela inicial</h3>

              <label style={styles.label}>Texto</label>
              <input
                style={styles.input}
                value={configSistema.textoContato}
                onChange={(e) =>
                  setConfigSistema({
                    ...configSistema,
                    textoContato: e.target.value,
                  })
                }
              />

              <label style={styles.label}>WhatsApp</label>
              <input
                style={styles.input}
                value={configSistema.whatsapp}
                onChange={(e) =>
                  setConfigSistema({
                    ...configSistema,
                    whatsapp: e.target.value,
                  })
                }
              />

              <label style={styles.label}>E-mail</label>
              <input
                style={styles.input}
                value={configSistema.email}
                onChange={(e) =>
                  setConfigSistema({
                    ...configSistema,
                    email: e.target.value,
                  })
                }
              />

              <button style={styles.primary} onClick={salvarConfigSistema}>
                Salvar contato
              </button>
            </div>

            <div style={styles.configBox}>
              <h3>Administradores</h3>

              <div style={styles.inputLine}>
                <input
                  style={styles.input}
                  placeholder="E-mail do novo administrador"
                  value={novoAdminEmail}
                  onChange={(e) => setNovoAdminEmail(e.target.value)}
                />

                <button style={styles.primary} onClick={adicionarAdmin}>
                  Adicionar admin
                </button>
              </div>

              {(configSistema.admins || []).map((adminEmail) => (
                <div key={adminEmail} style={styles.adminLinha}>
                  <span>{adminEmail}</span>

                  <button
                    style={styles.danger}
                    onClick={() => removerAdmin(adminEmail)}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>

          <h3>Professores pendentes</h3>

          {usuariosSistema.filter(
            (u) => u.tipo === 'professor' && u.status === 'pendente'
          ).length === 0 && <p>Nenhuma solicitação pendente.</p>}

          {usuariosSistema
            .filter((u) => u.tipo === 'professor' && u.status === 'pendente')
            .map((professor) => (
              <div key={professor.uid} style={styles.professorAdminCard}>
                <div>
                  <b>{professor.nome || professor.email}</b>
                  <br />
                  <small>{professor.email}</small>
                  <p>Status: pendente</p>
                </div>

                <div>
                  <button
                    style={styles.success}
                    onClick={() => aprovarProfessor(professor)}
                  >
                    Aprovar professor
                  </button>

                  <button
                    style={styles.danger}
                    onClick={() => bloquearProfessor(professor)}
                  >
                    Bloquear
                  </button>
                </div>
              </div>
            ))}

          <h3>Professores ativos</h3>

          {professoresResumoAdmin()
            .filter(({ professor }) => professor.status !== 'pendente')
            .map(({ professor, alunosProfessor, quantidadeAlunos }) => (
              <div key={professor.uid} style={styles.professorAdminCard}>
                <div>
                  <h3 style={{ margin: 0 }}>
                    {professor.nome || professor.email}
                  </h3>
                  <small>{professor.email}</small>

                  <p>
                    <b>Status:</b> {professor.status || 'aprovado'} |{' '}
                    <b>Ativação:</b> {professor.dataAtivacao || 'Não informado'}{' '}
                    | <b>Alunos:</b> {quantidadeAlunos}
                  </p>

                  {professor.aprovadoPor && (
                    <small>Aprovado por: {professor.aprovadoPor}</small>
                  )}

                  <details style={styles.detailsBox}>
                    <summary>
                      Ver alunos deste professor ({quantidadeAlunos})
                    </summary>

                    {alunosProfessor.length === 0 && (
                      <p>Nenhum aluno cadastrado.</p>
                    )}

                    {alunosProfessor.map((aluno) => (
                      <div key={aluno.id} style={styles.adminAlunoLinha}>
                        <b>{aluno.nome}</b>
                        <small>{aluno.email}</small>
                      </div>
                    ))}
                  </details>
                </div>

                <div>
                  <button
                    style={styles.danger}
                    onClick={() => bloquearProfessor(professor)}
                  >
                    Bloquear
                  </button>
                </div>
              </div>
            ))}
        </Card>
      )}

      {perfil?.tipo === 'professor' && (
        <div style={styles.grid2}>
          <Card>
            <h2>Cadastrar aluno</h2>

            <input
              style={styles.input}
              placeholder="Nome do aluno"
              value={novoAlunoNome}
              onChange={(e) => setNovoAlunoNome(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="E-mail do aluno"
              value={novoAlunoEmail}
              onChange={(e) => setNovoAlunoEmail(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Senha provisória"
              type="password"
              value={novoAlunoSenha}
              onChange={(e) => setNovoAlunoSenha(e.target.value)}
            />

            <label style={styles.label}>Foto do aluno</label>

            <input
              style={styles.input}
              type="file"
              accept="image/*"
              onChange={(e) =>
                lerImagemLocal(e, (foto) => setNovoAlunoFoto(foto))
              }
            />

            {novoAlunoFoto && (
              <img
                src={novoAlunoFoto}
                alt="Foto do aluno"
                style={styles.fotoPreview}
              />
            )}

            <button style={styles.primary} onClick={cadastrarAluno}>
              Cadastrar aluno
            </button>
          </Card>

          <Card>
            <h2>Criar treino</h2>

            <select
              style={styles.input}
              value={alunoSelecionado}
              onChange={(e) => {
                setAlunoSelecionado(e.target.value);
                setTreinoAbertoId('');
              }}
            >
              <option value="">Selecione o aluno</option>
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} - {a.email}
                </option>
              ))}
            </select>

            <label style={styles.label}>Nome do treino</label>

            <input
              style={styles.input}
              placeholder="Ex.: Treino A, Pernas, Costas, Superior"
              value={nomeTreino}
              onChange={(e) => setNomeTreino(e.target.value)}
            />

            <input
              style={styles.input}
              type="date"
              value={dataTreino}
              onChange={(e) => setDataTreino(e.target.value)}
            />

            <button style={styles.primary} onClick={criarTreino}>
              Criar treino
            </button>
          </Card>
        </div>
      )}

      {perfil?.tipo === 'professor' && (
        <div style={styles.professorTabs}>
          <button
            style={abaProfessor === 'treinos' ? styles.tabAtiva : styles.tab}
            onClick={() => setAbaProfessor('treinos')}
          >
            Treinos
          </button>

          <button
            style={abaProfessor === 'alunos' ? styles.tabAtiva : styles.tab}
            onClick={() => setAbaProfessor('alunos')}
          >
            Gerenciar alunos
          </button>
        </div>
      )}

      {perfil?.tipo === 'professor' && abaProfessor === 'alunos' && (
        <Card>
          <div style={styles.treinoHeader}>
            <div>
              <h2>Gerenciar alunos</h2>
              <p>Excluir alunos, editar e-mail e acompanhar progresso.</p>
            </div>

            <button style={styles.danger} onClick={zerarDadosProfessor}>
              Zerar banco deste professor
            </button>
          </div>

          {alunos.length === 0 && <p>Nenhum aluno cadastrado.</p>}

          <div style={styles.alunoGrid}>
            {alunos.map((aluno) => {
              const resumo = progressoAluno(aluno);

              return (
                <div key={aluno.id} style={styles.alunoCardGerenciar}>
                  <div style={styles.alunoLinhaTopo}>
                    <div style={styles.alunoInfoLinha}>
                      {aluno.foto && (
                        <img
                          src={aluno.foto}
                          alt={aluno.nome}
                          style={styles.alunoFotoMini}
                        />
                      )}

                      <div>
                        <h3 style={{ margin: 0 }}>{aluno.nome}</h3>
                        <small>{aluno.email}</small>
                      </div>
                    </div>

                    <div>
                      <button
                        style={styles.secondary}
                        onClick={() => editarEmailAluno(aluno)}
                      >
                        Editar e-mail
                      </button>

                      <button
                        style={styles.danger}
                        onClick={() => excluirAluno(aluno)}
                      >
                        Excluir aluno
                      </button>
                    </div>
                  </div>

                  <p>
                    <b>Treinos:</b> {resumo.treinos}
                  </p>

                  <p>
                    <b>Exercícios:</b> {resumo.concluidos}/
                    {resumo.totalExercicios}
                  </p>

                  <ProgressBar value={resumo.progresso} />

                  <button
                    style={styles.success}
                    onClick={() =>
                      setAlunoDashId(alunoDashId === aluno.id ? '' : aluno.id)
                    }
                  >
                    {alunoDashId === aluno.id
                      ? 'Fechar dashboard'
                      : 'Abrir dashboard'}
                  </button>

                  <button
                    style={styles.primary}
                    onClick={() => {
                      setAlunoSelecionado(aluno.id);
                      setAbaProfessor('treinos');
                      setTreinoAbertoId('');
                    }}
                  >
                    Ver treinos deste aluno
                  </button>

                  {alunoDashId === aluno.id && (
                    <DashboardAluno
                      aluno={aluno}
                      dados={alunoDashboard(aluno)}
                      avaliacaoDraft={avaliacaoDraft}
                      atualizarAvaliacao={atualizarAvaliacao}
                      salvarAvaliacaoAluno={salvarAvaliacaoAluno}
                      editarAvaliacao={editarAvaliacao}
                      excluirAvaliacaoAluno={excluirAvaliacaoAluno}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {perfil?.tipo === 'aluno' && abaAtiva === 'inicio' && (
        <div style={styles.mobileHome}>
          <div style={styles.mobileHero}>
            <div>
              <small style={styles.mobileMuted}>Bem-vindo de volta</small>
              <h2 style={{ margin: '6px 0 0' }}>{perfil?.nome || 'Aluno'} 👋</h2>
              <p style={styles.mobileMuted}>Foque no treino de hoje e mantenha sua evolução.</p>
            </div>
            {perfil?.foto && <img src={perfil.foto} alt="Foto" style={styles.mobileAvatar} />}
          </div>

          <div style={styles.mobileStatsGrid}>
            <div style={styles.mobileStatCard}>
              <span>Treinos</span>
              <b>{treinos.length}</b>
              <small>ativos</small>
            </div>
            <div style={styles.mobileStatCard}>
              <span>Progresso</span>
              <b>{treinosOrdenados[0] ? Math.round(calcularProgresso(treinosOrdenados[0])) : 0}%</b>
              <small>treino atual</small>
            </div>
            <div style={styles.mobileStatCard}>
              <span>Status</span>
              <b>{online ? 'Online' : 'Offline'}</b>
              <small>sincronização</small>
            </div>
          </div>

          {treinosOrdenados[0] && (
            <div style={styles.mobileWorkoutCard}>
              <small style={styles.mobileMuted}>Treino em destaque</small>
              <h2>{treinosOrdenados[0].nome}</h2>
              <ProgressBar value={calcularProgresso(treinosOrdenados[0])} />
              <button
                style={styles.mobilePrimaryFull}
                onClick={() => {
                  setTreinoAbertoId(treinosOrdenados[0].id);
                  setAbaAtiva('treinos');
                }}
              >
                ▶ Abrir treino
              </button>
            </div>
          )}
        </div>
      )}

      {perfil?.tipo === 'aluno' && abaAtiva === 'configuracoes' && (
        <Card>
          <h2>Configurações</h2>
          <p style={styles.mobileMuted}>Preferências gerais do aluno.</p>

          <label style={styles.label}>Som do timer</label>
          <select
            style={styles.input}
            value={somTimer}
            onChange={(e) =>
              setSomTimer(e.target.value as 'padrao' | 'sino' | 'eletronico' | 'vitoria')
            }
          >
            <option value="padrao">Padrão / Bip</option>
            <option value="sino">Sino</option>
            <option value="eletronico">Eletrônico</option>
            <option value="vitoria">Vitória</option>
          </select>

          <button style={styles.primary} onClick={tocarSomProfissional}>
            Testar som
          </button>

          <button style={styles.secondary} onClick={solicitarNotificacoes}>
            Notificações: {notificacoes}
          </button>

          <p style={styles.mobileMuted}>
            O tempo de descanso continua sendo definido pelo professor em cada exercício.
          </p>
        </Card>
      )}

      {perfil?.tipo === 'aluno' && abaAtiva === 'estatisticas' && (
        <Card>
          <h2>Estatísticas</h2>
          <div style={styles.mobileStatsGrid}>
            <div style={styles.mobileStatCard}>
              <span>Treinos</span>
              <b>{treinos.length}</b>
              <small>total</small>
            </div>
            <div style={styles.mobileStatCard}>
              <span>Exercícios</span>
              <b>{treinos.reduce((acc, t) => acc + (t.exercicios?.length || 0), 0)}</b>
              <small>cadastrados</small>
            </div>
            <div style={styles.mobileStatCard}>
              <span>Finalizados</span>
              <b>{treinos.reduce((acc, t) => acc + (t.exercicios || []).filter((e) => e.finalizado).length, 0)}</b>
              <small>concluídos</small>
            </div>
          </div>
          {treinosOrdenados.map((t) => (
            <div key={t.id} style={styles.statsWorkoutLine}>
              <b>{t.nome}</b>
              <ProgressBar value={calcularProgresso(t)} />
            </div>
          ))}
        </Card>
      )}

      {perfil?.tipo === 'aluno' && abaAtiva === 'avaliacoes' && (
        <Card>
          <h2>Avaliações</h2>
          <p style={styles.mobileMuted}>
            Suas avaliações físicas e histórico aparecerão aqui quando o professor registrar.
          </p>
          {alunos[0]?.avaliacoes?.length ? (
            alunos[0].avaliacoes.map((av) => (
              <div key={av.id} style={styles.statsWorkoutLine}>
                <b>{av.data}</b>
                <p>Peso: {av.peso || '-'} kg | IMC: {av.imc || '-'}</p>
              </div>
            ))
          ) : (
            <p>Nenhuma avaliação cadastrada.</p>
          )}
        </Card>
      )}

      {perfil?.tipo === 'aluno' && abaAtiva === 'mensagens' && (
        <Card>
          <h2>Mensagens</h2>
          <p style={styles.mobileMuted}>Mensagens dos treinos aparecem abaixo.</p>
          {treinos.flatMap((t) => (t.mensagens || []).map((m, i) => ({ ...m, treino: t.nome, id: `${t.id}-${i}` }))).length === 0 && (
            <p>Nenhuma mensagem ainda.</p>
          )}
          {treinos.flatMap((t) => (t.mensagens || []).map((m, i) => ({ ...m, treino: t.nome, id: `${t.id}-${i}` }))).map((m) => (
            <div key={m.id} style={styles.messageCardPremium}>
              <small>{m.treino}</small>
              <p><b>{m.autor}:</b> {m.texto}</p>
              <small>{m.data}</small>
            </div>
          ))}
        </Card>
      )}

      {((perfil?.tipo === 'aluno' ? abaAtiva === 'treinos' : abaProfessor === 'treinos')) && (
        <>
          {perfil?.tipo === 'professor' && (
            <Card>
              <h2>Selecionar aluno</h2>

              <p>
                Escolha um aluno. Depois disso, aparecem somente os treinos
                desse aluno.
              </p>

              <select
                style={styles.input}
                value={alunoSelecionado}
                onChange={(e) => {
                  setAlunoSelecionado(e.target.value);
                  setTreinoAbertoId('');
                }}
              >
                <option value="">Selecione um aluno</option>
                {alunos.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome} - {aluno.email}
                  </option>
                ))}
              </select>

              {alunoSelecionadoObj && (
                <div style={styles.alunoSelecionadoBox}>
                  <b>Aluno selecionado:</b> {alunoSelecionadoObj.nome}
                  <br />
                  <small>{alunoSelecionadoObj.email}</small>
                </div>
              )}
            </Card>
          )}

          <h2 style={{ color: 'white' }}>
            {perfil?.tipo === 'professor' && alunoSelecionadoObj
              ? `Treinos de ${alunoSelecionadoObj.nome}`
              : 'Treinos'}
          </h2>

          {perfil?.tipo === 'professor' && !alunoSelecionadoObj && (
            <Card>
              <h3>Selecione um aluno</h3>
              <p>
                Escolha um aluno no campo acima. Enquanto nenhum aluno estiver
                selecionado, nenhum treino será exibido para evitar mistura de
                treinos.
              </p>
            </Card>
          )}

          <div style={styles.treinoTabs}>
            {treinosOrdenados.map((t) => {
              const progresso = calcularProgresso(t);

              return (
                <button
                  key={t.id}
                  style={treinoAbertoId === t.id ? styles.tabAtiva : styles.tab}
                  onClick={() => setTreinoAbertoId(t.id)}
                >
                  {t.nome} - {Math.round(progresso)}%
                </button>
              );
            })}
          </div>

          {treinosOrdenados
            .filter((t) => t.id === treinoAbertoId)
            .map((treino) => {
              const exerciciosOrdenados = ordenarExercicios(
                treino.exercicios || []
              );
              const progresso = calcularProgresso(treino);
              const finalizado =
                progresso === 100 && (treino.exercicios || []).length > 0;

              return (
                <Card key={treino.id}>
                  <div style={styles.treinoHeader}>
                    <div>
                      {perfil?.tipo === 'professor' ? (
                        <div>
                          <label style={styles.label}>Nome do treino</label>

                          <input
                            style={styles.input}
                            value={treino.nome}
                            onChange={(e) =>
                              alterarNomeTreinoLocal(treino.id, e.target.value)
                            }
                          />

                          <button
                            style={styles.secondary}
                            onClick={() => salvarNomeTreino(treino)}
                          >
                            Salvar nome do treino
                          </button>
                        </div>
                      ) : (
                        <h2>{treino.nome}</h2>
                      )}

                      <p>
                        <b>Aluno:</b> {treino.alunoNome} - {treino.alunoEmail}
                      </p>

                      {treino.dataTreino && (
                        <p>
                          <b>Data:</b> {treino.dataTreino}
                        </p>
                      )}
                    </div>

                    <div>
                      {perfil?.tipo === 'professor' && (
                        <button
                          style={styles.primary}
                          onClick={() => adicionarExercicio()}
                        >
                          Criar novo exercício
                        </button>
                      )}

                      <button
                        style={styles.secondary}
                        onClick={() => reiniciarTreino(treino)}
                      >
                        Reiniciar treino
                      </button>

                      {perfil?.tipo === 'professor' && (
                        <button
                          style={styles.danger}
                          onClick={() => excluirTreino(treino.id)}
                        >
                          Excluir treino
                        </button>
                      )}
                    </div>
                  </div>

                  <ProgressBar value={progresso} />

                  {finalizado && (
                    <p style={styles.ok}>
                      Treino finalizado. Clique em reiniciar para repetir na
                      semana.
                    </p>
                  )}

                  {perfil?.tipo === 'professor' && modelosExercicios.length > 0 && (
                    <div style={styles.modelosBox}>
                      <div style={styles.modelosHeader}>
                        <div>
                          <h3 style={{ margin: 0 }}>Meus exercícios salvos</h3>
                          <small>Use apenas os modelos criados pelo professor logado.</small>
                        </div>
                      </div>

                      <div style={styles.modelosGrid}>
                        {modelosExercicios.map((modelo) => (
                          <div key={modelo.id} style={styles.modeloCard}>
                            <b>{modelo.nome || 'Exercício sem nome'}</b>
                            <small>
                              {modelo.series || '-'} séries | {modelo.repeticoes || '-'} reps | descanso {modelo.descanso || '-'}s
                            </small>

                            {modelo.metodo && <small>Método: {modelo.metodo}</small>}

                            <div>
                              <button
                                style={styles.success}
                                onClick={() => usarModeloExercicio(treino, modelo)}
                              >
                                Usar neste treino
                              </button>

                              <button
                                style={styles.danger}
                                onClick={() => excluirModeloExercicio(modelo.id)}
                              >
                                Excluir modelo
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {perfil?.tipo === 'professor' && novoExercicioDraft && (
                    <div
                      style={{
                        ...styles.exercise,
                        border: '2px solid #2563eb',
                        background: '#eff6ff',
                      }}
                    >
                      <h3>Novo exercício</h3>

                      <p>
                        Preencha os campos e clique em salvar. Ele será
                        adicionado no topo do treino.
                      </p>

                      <Field
                        label="Nome do exercício"
                        disabled={false}
                        value={novoExercicioDraft.nome}
                        onChange={(v: any) => atualizarNovoExercicio('nome', v)}
                      />

                      <Field
                        label="Séries"
                        disabled={false}
                        value={novoExercicioDraft.series}
                        onChange={(v: any) =>
                          atualizarNovoExercicio('series', v)
                        }
                      />

                      <Field
                        label="Repetições"
                        disabled={false}
                        value={novoExercicioDraft.repeticoes}
                        onChange={(v: any) =>
                          atualizarNovoExercicio('repeticoes', v)
                        }
                      />

                      <Field
                        label="Descanso em segundos"
                        disabled={false}
                        value={novoExercicioDraft.descanso}
                        onChange={(v: any) =>
                          atualizarNovoExercicio('descanso', v)
                        }
                      />

                      <Field
                        label="Carga sugerida"
                        disabled={false}
                        value={novoExercicioDraft.cargaSugerida}
                        onChange={(v: any) =>
                          atualizarNovoExercicio('cargaSugerida', v)
                        }
                      />

                      <Field
                        label="Método"
                        disabled={false}
                        value={novoExercicioDraft.metodo}
                        onChange={(v: any) =>
                          atualizarNovoExercicio('metodo', v)
                        }
                      />

                      <Field
                        label="Velocidade"
                        disabled={false}
                        value={novoExercicioDraft.velocidade}
                        onChange={(v: any) =>
                          atualizarNovoExercicio('velocidade', v)
                        }
                      />

                      <Field
                        label="Vídeo/GIF"
                        disabled={false}
                        value={novoExercicioDraft.video}
                        onChange={(v: any) =>
                          atualizarNovoExercicio('video', v)
                        }
                      />

                      <Field
                        label="Observação professor"
                        disabled={false}
                        value={novoExercicioDraft.obsProfessor}
                        onChange={(v: any) =>
                          atualizarNovoExercicio('obsProfessor', v)
                        }
                      />

                      <button
                        style={styles.success}
                        onClick={() => salvarNovoExercicio(treino)}
                      >
                        Salvar novo exercício
                      </button>

                      <button
                        style={styles.secondary}
                        onClick={() => setNovoExercicioDraft(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {exerciciosOrdenados.map((ex) => {
                    const aberto = exercicioAbertoId === ex.id;

                    return (
                      <MobileExerciseCard
                        key={ex.id}
                        ex={ex}
                        treino={treino}
                        perfil={perfil}
                        aberto={aberto}
                        timerAtivo={timerAtivo}
                        tempoRestante={tempoRestante}
                        timerInfo={timerInfo}
                        onToggle={() => setExercicioAbertoId(aberto ? '' : ex.id)}
                        onDragStart={() => setDragExercicioId(ex.id)}
                        onDrop={() => moverExercicio(treino, ex.id)}
                        onAtualizar={(campo: keyof Exercicio, valor: any) =>
                          atualizarExercicio(treino, ex.id, campo, valor)
                        }
                        onMarcarSerie={(serie: number) =>
                          marcarSerie(treino, ex, serie)
                        }
                        onFinalizar={() => finalizarExercicio(treino, ex)}
                        onExcluir={() => excluirExercicio(treino, ex.id)}
                        onSalvarModelo={() => salvarExercicioComoModelo(ex)}
                        onFecharTimer={() => setTimerAtivo(false)}
                      />
                    );
                  })}

                  <div style={styles.messages}>
                    <h3>Mensagens</h3>

                    {(treino.mensagens || []).map((m, i) => (
                      <p key={i}>
                        <b>{m.autor}:</b> {m.texto} <small>{m.data}</small>
                      </p>
                    ))}

                    <input
                      style={styles.input}
                      placeholder="Mensagem"
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                    />

                    <button
                      style={styles.primary}
                      onClick={() => enviarMensagem(treino)}
                    >
                      Enviar
                    </button>
                  </div>
                </Card>
              );
            })}
        </>
      )}
    </Page>
  );
}

function MobileExerciseCard({
  ex,
  treino,
  perfil,
  aberto,
  timerAtivo,
  tempoRestante,
  timerInfo,
  onToggle,
  onDragStart,
  onDrop,
  onAtualizar,
  onMarcarSerie,
  onFinalizar,
  onExcluir,
  onSalvarModelo,
  onFecharTimer,
}: any) {
  const totalSeries = Number(ex.series) || 0;
  const feitas = ex.seriesConcluidas || [];
  const proximaSerie =
    Array.from({ length: totalSeries }, (_, i) => i + 1).find(
      (serie) => !feitas.includes(serie)
    ) || totalSeries;

  const descanso = Number(ex.descanso) || 0;
  const timerDesteExercicio =
    timerAtivo && String(timerInfo || '').toLowerCase().includes(String(ex.nome || '').toLowerCase());

  const tempoParaMostrar = timerDesteExercicio
    ? tempoRestante
    : descanso;

  if (!aberto) {
    return (
      <div
        draggable={perfil?.tipo === 'professor'}
        onDragStart={onDragStart}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={onToggle}
        style={mobileStyles.exerciseMini}
      >
        <div style={mobileStyles.miniLeft}>
          <span style={ex.finalizado ? mobileStyles.checkDone : mobileStyles.checkEmpty}>
            {ex.finalizado ? '✓' : ''}
          </span>

          <div>
            <b>{ex.nome || 'Exercício sem nome'}</b>
            <small style={mobileStyles.textSoft}>
              {ex.series || '-'} séries • {ex.repeticoes || '-'} reps • {ex.descanso || '-'}s
            </small>
          </div>
        </div>

        <small style={mobileStyles.textSoft}>Minimizado</small>
      </div>
    );
  }

  return (
    <div
      draggable={perfil?.tipo === 'professor'}
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={mobileStyles.screenCard}
    >
      <div style={mobileStyles.mobileTop}>
        <button style={mobileStyles.backButton} onClick={onToggle}>
          ‹ Voltar
        </button>

        <div style={mobileStyles.topTitle}>
          <b>{treino.nome || 'Treino'}</b>
          <div style={mobileStyles.progressDots}>
            {Array.from({ length: Math.min(Math.max(totalSeries, 4), 6) }, (_, i) => (
              <span
                key={i}
                style={{
                  ...mobileStyles.dot,
                  background: i < feitas.length ? '#7C3AED' : '#334155',
                }}
              />
            ))}
          </div>
        </div>

        <button style={mobileStyles.moreButton}>•••</button>
      </div>

      <div style={mobileStyles.heroCard}>
        <div style={mobileStyles.exerciseIcon}>🏋️</div>

        <div style={{ flex: 1 }}>
          <h2 style={mobileStyles.exerciseName}>{ex.nome || 'Exercício sem nome'}</h2>
          <p style={mobileStyles.exerciseSub}>
            {ex.cargaSugerida ? `Carga sugerida: ${ex.cargaSugerida}` : 'Execução do exercício'}
          </p>

          <div style={mobileStyles.chipsRow}>
            <span style={mobileStyles.chip}>▰ {ex.series || '-'} séries</span>
            <span style={mobileStyles.chip}>↻ {ex.repeticoes || '-'} reps</span>
            <span style={mobileStyles.chip}>◷ {ex.descanso || '-'}s descanso</span>
            <span style={mobileStyles.chip}>⚗ Método: {ex.metodo || '-'}</span>
          </div>
        </div>

        <button style={mobileStyles.bookmarkButton}>♡</button>
      </div>

      <div style={mobileStyles.videoCard}>
        <PlayerVideoSeguro url={ex.video} nome={ex.nome} />

        {(perfil?.tipo === 'aluno' || perfil?.tipo === 'professor') && (
          <div style={mobileStyles.videoInputBox}>
            <input
              style={mobileStyles.videoInput}
              placeholder="Cole o link do vídeo deste exercício"
              value={ex.video || ''}
              onChange={(e) => onAtualizar('video', e.target.value)}
            />
          </div>
        )}
      </div>

      <div style={mobileStyles.sectionHeader}>
        <h3 style={{ margin: 0 }}>Séries</h3>
        <button style={mobileStyles.historyButton}>↗ Ver histórico</button>
      </div>

      <div style={mobileStyles.seriesGrid}>
        {Array.from({ length: totalSeries || 1 }, (_, i) => {
          const serie = i + 1;
          const concluida = feitas.includes(serie);
          const emAndamento = !concluida && serie === proximaSerie;

          return (
            <button
              key={serie}
              style={{
                ...mobileStyles.serieCard,
                ...(concluida ? mobileStyles.serieDone : {}),
                ...(emAndamento ? mobileStyles.serieActive : {}),
              }}
              onClick={() => onMarcarSerie(serie)}
            >
              <span
                style={{
                  ...mobileStyles.serieIcon,
                  background: concluida
                    ? '#22C55E'
                    : emAndamento
                    ? '#7C3AED'
                    : '#334155',
                }}
              >
                {concluida ? '✓' : emAndamento ? '▶' : serie}
              </span>

              <b>Série {serie}</b>
              <small>{ex.repeticoes || '-'} reps</small>
              <small
                style={{
                  color: concluida ? '#22C55E' : emAndamento ? '#A855F7' : '#CBD5E1',
                }}
              >
                {concluida ? '✓ Concluída' : emAndamento ? 'Em andamento' : 'Pendente'}
              </small>
            </button>
          );
        })}
      </div>

      <div style={mobileStyles.timerCard}>
        <div style={mobileStyles.timerTop}>
          <b style={{ color: '#A855F7' }}>SÉRIE {proximaSerie || 1}</b>
          <span>
            Descanso: {descanso || '-'}s ✎
          </span>
        </div>

        <div style={mobileStyles.timerCircle}>
          <div
            style={{
              ...mobileStyles.timerRing,
              background: `conic-gradient(#7C3AED ${timerDesteExercicio ? 65 : 0}%, #1E293B 0%)`,
            }}
          >
            <div style={mobileStyles.timerInner}>
              <strong>{formatarTempo(Number(tempoParaMostrar) || 0)}</strong>
              <span>{timerDesteExercicio ? 'Descansando' : 'Pronto'}</span>
            </div>
          </div>

          <button style={mobileStyles.pauseButton}>
            {timerDesteExercicio ? 'Ⅱ' : '▶'}
          </button>
        </div>

        <div style={mobileStyles.timerActions}>
          <span>🔊 Som do timer</span>
          <button style={mobileStyles.skipButton} onClick={onFecharTimer}>
            Pular descanso ▷
          </button>
        </div>
      </div>

      <details style={mobileStyles.dropCard}>
        <summary style={mobileStyles.dropSummary}>
          <span>🏋️ Carga utilizada</span>
          <span>›</span>
        </summary>

        <input
          style={mobileStyles.inputMobile}
          placeholder="Ex.: 60 kg"
          value={ex.cargaAtual || ''}
          disabled={perfil?.tipo !== 'aluno'}
          onChange={(e) => onAtualizar('cargaAtual', e.target.value)}
        />
      </details>

      <details style={mobileStyles.dropCard}>
        <summary style={mobileStyles.dropSummary}>
          <span>📋 Observações</span>
          <span>›</span>
        </summary>

        <textarea
          style={mobileStyles.textareaMobile}
          placeholder="Como foi a execução?"
          value={perfil?.tipo === 'aluno' ? ex.obsAluno || '' : ex.obsProfessor || ''}
          onChange={(e) =>
            onAtualizar(
              perfil?.tipo === 'aluno' ? 'obsAluno' : 'obsProfessor',
              e.target.value
            )
          }
        />
      </details>

      {perfil?.tipo === 'professor' && (
        <details style={mobileStyles.dropCard}>
          <summary style={mobileStyles.dropSummary}>
            <span>✏️ Editar exercício</span>
            <span>›</span>
          </summary>

          <input
            style={mobileStyles.inputMobile}
            placeholder="Nome"
            value={ex.nome || ''}
            onChange={(e) => onAtualizar('nome', e.target.value)}
          />

          <input
            style={mobileStyles.inputMobile}
            placeholder="Séries"
            value={ex.series || ''}
            onChange={(e) => onAtualizar('series', e.target.value)}
          />

          <input
            style={mobileStyles.inputMobile}
            placeholder="Repetições"
            value={ex.repeticoes || ''}
            onChange={(e) => onAtualizar('repeticoes', e.target.value)}
          />

          <input
            style={mobileStyles.inputMobile}
            placeholder="Descanso em segundos"
            value={ex.descanso || ''}
            onChange={(e) => onAtualizar('descanso', e.target.value)}
          />

          <input
            style={mobileStyles.inputMobile}
            placeholder="Método"
            value={ex.metodo || ''}
            onChange={(e) => onAtualizar('metodo', e.target.value)}
          />

          <button style={mobileStyles.secondaryButton} onClick={onSalvarModelo}>
            Salvar como modelo
          </button>

          <button style={mobileStyles.deleteButton} onClick={onExcluir}>
            Excluir exercício
          </button>
        </details>
      )}

      <button style={mobileStyles.finishButton} onClick={onFinalizar}>
        ✓ Finalizar exercício
      </button>
    </div>
  );
}




function PlayerVideoSeguro({ url, nome }: { url: string; nome: string }) {
  const original = String(url || '').trim();
  const normalizada = normalizarUrlVideo(original);
  const lower = normalizada.toLowerCase();

  if (!normalizada) {
    return (
      <div style={mobileStyles.videoEmpty}>
        <div style={mobileStyles.playCircle}>▶</div>
        <b>Assistir execução</b>
        <small>Adicione um link de vídeo para aparecer aqui</small>
      </div>
    );
  }

  const isImagem =
    lower.match(/\.(gif|png|jpg|jpeg|webp)(\?|$)/) ||
    lower.includes('media.giphy.com') ||
    lower.includes('giphy.com/media');

  const isVideoDireto = lower.match(/\.(mp4|webm|ogg|mov)(\?|$)/);

  const isEmbedPermitido =
    lower.includes('youtube.com/embed/') ||
    lower.includes('youtube-nocookie.com/embed/') ||
    lower.includes('player.vimeo.com/video/');

  if (isImagem) {
    return (
      <img
        src={normalizada}
        alt={nome || 'Execução do exercício'}
        style={mobileStyles.videoFrame}
      />
    );
  }

  if (isVideoDireto) {
    return (
      <video
        src={normalizada}
        controls
        playsInline
        style={mobileStyles.videoFrame}
      />
    );
  }

  if (isEmbedPermitido) {
    return (
      <iframe
        src={normalizada}
        title={`Vídeo - ${nome || 'Exercício'}`}
        style={mobileStyles.videoFrame}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return (
    <div style={mobileStyles.videoEmpty}>
      <div style={mobileStyles.playCircle}>↗</div>
      <b>Este site bloqueia player interno</b>
      <small>Use YouTube, Vimeo, GIF direto ou MP4 direto.</small>
      <a
        href={normalizada}
        target="_blank"
        rel="noreferrer"
        style={mobileStyles.openVideoLink}
      >
        Abrir vídeo
      </a>
    </div>
  );
}


const mobileStyles: any = {
  screenCard: {
    background: 'linear-gradient(180deg,#0B1020 0%, #111827 100%)',
    border: '1px solid #253047',
    borderRadius: 28,
    padding: 14,
    marginBottom: 22,
    color: 'white',
    boxShadow: '0 20px 45px rgba(0,0,0,0.35)',
  },
  mobileTop: {
    display: 'grid',
    gridTemplateColumns: '90px 1fr 45px',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: 18,
    textAlign: 'left',
    cursor: 'pointer',
  },
  topTitle: {
    textAlign: 'center',
    fontSize: 17,
  },
  progressDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 28,
    height: 5,
    borderRadius: 999,
    display: 'inline-block',
  },
  moreButton: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: 20,
    cursor: 'pointer',
  },
  heroCard: {
    background: 'linear-gradient(135deg,#111827,#0F172A)',
    border: '1px solid #1F2937',
    borderRadius: 26,
    padding: 18,
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exerciseIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    background: 'linear-gradient(135deg,#7C3AED,#4C1D95)',
    display: 'grid',
    placeItems: 'center',
    fontSize: 34,
    flexShrink: 0,
  },
  exerciseName: {
    margin: '0 0 6px',
    fontSize: 28,
    lineHeight: 1.05,
  },
  exerciseSub: {
    margin: '0 0 14px',
    color: '#A7B0C0',
    fontSize: 15,
  },
  chipsRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    background: '#1F2937',
    border: '1px solid #263244',
    borderRadius: 12,
    padding: '9px 10px',
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: 700,
  },
  bookmarkButton: {
    background: 'transparent',
    border: '1px solid #7C3AED',
    color: '#A855F7',
    borderRadius: 12,
    fontSize: 22,
    width: 42,
    height: 42,
  },
  videoCard: {
    position: 'relative',
    background: '#050816',
    border: '1px solid #263244',
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 20,
  },
  videoFrame: {
    width: '100%',
    height: 230,
    border: 'none',
    display: 'block',
    background: '#020617',
  },
  videoEmpty: {
    height: 220,
    display: 'grid',
    placeItems: 'center',
    textAlign: 'center',
    color: '#CBD5E1',
    padding: 20,
  },

  openVideoLink: {
    marginTop: 10,
    color: 'white',
    background: 'linear-gradient(135deg,#7C3AED,#9333EA)',
    padding: '10px 14px',
    borderRadius: 12,
    textDecoration: 'none',
    fontWeight: 900,
    display: 'inline-block',
  },
  playCircle: {
    width: 78,
    height: 78,
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#7C3AED,#9333EA)',
    display: 'grid',
    placeItems: 'center',
    fontSize: 30,
    boxShadow: '0 0 30px rgba(124,58,237,.45)',
  },
  videoInputBox: {
    padding: 12,
    borderTop: '1px solid #1E293B',
    background: 'rgba(15,23,42,.85)',
  },
  videoInput: {
    width: '100%',
    background: '#0B1020',
    border: '1px solid #263244',
    borderRadius: 14,
    color: 'white',
    padding: '13px 14px',
    boxSizing: 'border-box',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '8px 4px 14px',
  },
  historyButton: {
    background: 'transparent',
    border: 'none',
    color: '#A855F7',
    fontWeight: 800,
    fontSize: 15,
  },
  seriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
    gap: 12,
    marginBottom: 16,
  },
  serieCard: {
    background: '#111827',
    border: '1px solid #334155',
    color: 'white',
    borderRadius: 20,
    minHeight: 142,
    padding: 14,
    display: 'grid',
    gap: 6,
    placeItems: 'center',
    cursor: 'pointer',
  },
  serieDone: {
    borderColor: '#22C55E',
    background: 'linear-gradient(180deg,rgba(34,197,94,.22),#0B1020)',
  },
  serieActive: {
    borderColor: '#7C3AED',
    background: 'linear-gradient(180deg,rgba(124,58,237,.25),#0B1020)',
  },
  serieIcon: {
    width: 50,
    height: 50,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    fontSize: 18,
    fontWeight: 900,
  },
  timerCard: {
    background: 'linear-gradient(135deg,#111827,#0B1020)',
    border: '1px solid #263244',
    borderRadius: 26,
    padding: 18,
    marginBottom: 14,
  },
  timerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timerCircle: {
    display: 'grid',
    placeItems: 'center',
    position: 'relative',
    margin: '8px 0',
  },
  timerRing: {
    width: 210,
    height: 210,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
  },
  timerInner: {
    width: 165,
    height: 165,
    borderRadius: '50%',
    background: '#0B1020',
    display: 'grid',
    placeItems: 'center',
    alignContent: 'center',
    boxShadow: 'inset 0 0 25px rgba(0,0,0,.45)',
  },
  pauseButton: {
    position: 'absolute',
    bottom: -6,
    width: 58,
    height: 58,
    borderRadius: '50%',
    border: 'none',
    color: 'white',
    background: 'linear-gradient(135deg,#7C3AED,#9333EA)',
    fontSize: 24,
    fontWeight: 900,
    boxShadow: '0 0 22px rgba(124,58,237,.45)',
  },
  timerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    color: '#E5E7EB',
  },
  skipButton: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontWeight: 700,
  },
  dropCard: {
    background: 'linear-gradient(135deg,#111827,#0B1020)',
    border: '1px solid #263244',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  dropSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    cursor: 'pointer',
    fontWeight: 800,
  },
  inputMobile: {
    width: '100%',
    background: '#050816',
    border: '1px solid #263244',
    color: 'white',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    boxSizing: 'border-box',
  },
  textareaMobile: {
    width: '100%',
    minHeight: 100,
    background: '#050816',
    border: '1px solid #263244',
    color: 'white',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  finishButton: {
    width: '100%',
    border: 'none',
    borderRadius: 18,
    padding: '18px 20px',
    color: 'white',
    fontSize: 18,
    fontWeight: 900,
    background: 'linear-gradient(135deg,#7C3AED,#6D28D9)',
    boxShadow: '0 0 24px rgba(124,58,237,.35)',
    cursor: 'pointer',
  },
  secondaryButton: {
    width: '100%',
    border: '1px solid #334155',
    borderRadius: 14,
    padding: '14px 16px',
    color: 'white',
    fontWeight: 800,
    background: '#1E293B',
    marginTop: 10,
    cursor: 'pointer',
  },
  deleteButton: {
    width: '100%',
    border: 'none',
    borderRadius: 14,
    padding: '14px 16px',
    color: 'white',
    fontWeight: 800,
    background: 'linear-gradient(135deg,#DC2626,#EF4444)',
    marginTop: 10,
    cursor: 'pointer',
  },
  exerciseMini: {
    background: 'linear-gradient(135deg,#111827,#0B1020)',
    border: '1px solid #253047',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
  },
  miniLeft: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  checkDone: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: '#22C55E',
    color: 'white',
    fontWeight: 900,
  },
  checkEmpty: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    border: '1px solid #64748B',
  },
  textSoft: {
    color: '#94A3B8',
    display: 'block',
    marginTop: 3,
  },
};

function normalizarUrlVideo(url: string) {
  if (!url) return '';

  let link = String(url).trim();
  if (!link) return '';

  if (link.startsWith('www.')) link = `https://${link}`;
  if (link.startsWith('youtube.com')) link = `https://www.${link}`;
  if (link.startsWith('m.youtube.com')) link = `https://${link}`;
  if (link.startsWith('youtu.be')) link = `https://${link}`;
  if (link.startsWith('ttps://')) link = `h${link}`;
  if (link.startsWith('ps://')) link = `htt${link}`;

  try {
    const u = new URL(link);
    const host = u.hostname.replace('www.', '');

    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com'
    ) {
      let id =
        u.searchParams.get('v') ||
        u.pathname.split('/shorts/')[1] ||
        u.pathname.split('/embed/')[1] ||
        '';

      id = id.split('?')[0].split('&')[0].split('/')[0];

      return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1` : '';
    }

    if (host === 'youtu.be') {
      const id = u.pathname.replace('/', '').split('?')[0].split('&')[0];
      return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1` : '';
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean).pop() || '';
      return id ? `https://player.vimeo.com/video/${id}` : '';
    }

    return link;
  } catch {
    return '';
  }
}

function MenuItem({ label, icon, ativo, onClick }: any) {
  return (
    <button style={ativo ? styles.sideMenuItemActive : styles.sideMenuItem} onClick={onClick}>
      <span>{icon}</span>
      <b>{label}</b>
    </button>
  );
}

function ordenarExercicios(exercicios: Exercicio[]) {
  const lista = [...exercicios].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  return [
    ...lista.filter((e) => !e.finalizado),
    ...lista.filter((e) => e.finalizado),
  ];
}

function calcularProgresso(treino: Treino) {
  const total = treino.exercicios?.length || 0;

  if (!total) return 0;

  const feitos = treino.exercicios.filter((e) => e.finalizado).length;
  return (feitos / total) * 100;
}

function formatarTempo(segundos: number) {
  const m = Math.floor(segundos / 60)
    .toString()
    .padStart(2, '0');
  const s = (segundos % 60).toString().padStart(2, '0');

  return `${m}:${s}`;
}

function traduzErro(msg: string) {
  if (msg.includes('EMAIL_EXISTS')) return 'Esse e-mail já está cadastrado.';
  if (msg.includes('auth/invalid-email')) return 'E-mail inválido.';
  if (msg.includes('auth/email-already-in-use'))
    return 'Esse e-mail já está cadastrado.';
  if (msg.includes('auth/weak-password'))
    return 'A senha precisa ter no mínimo 6 caracteres.';
  if (msg.includes('auth/invalid-credential'))
    return 'E-mail ou senha incorretos.';
  if (msg.includes('auth/requires-recent-login')) {
    return 'Por segurança, saia e entre novamente antes de trocar a senha.';
  }

  return msg;
}

function Page({ children }: any) {
  return (
    <div style={styles.page}>
      <div style={styles.container}>{children}</div>
    </div>
  );
}

function Card({ children, compacto }: any) {
  return (
    <div style={compacto ? styles.cardCompacto : styles.card}>{children}</div>
  );
}

function Field({ label, value, onChange, disabled }: any) {
  return (
    <label style={styles.label}>
      {label}
      <input
        style={styles.input}
        disabled={disabled}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function ProgressBar({ value }: any) {
  return (
    <div>
      <b>Progresso: {Math.round(value)}%</b>

      <div style={styles.progressBg}>
        <div style={{ ...styles.progressFill, width: `${value}%` }} />
      </div>
    </div>
  );
}

function DashboardAluno({
  aluno,
  dados,
  avaliacaoDraft,
  atualizarAvaliacao,
  salvarAvaliacaoAluno,
  editarAvaliacao,
  excluirAvaliacaoAluno,
}: any) {
  const ultima = dados.avaliacoes?.[0];

  return (
    <div style={styles.dashboardAluno}>
      <h3>Dashboard do aluno</h3>

      <div style={styles.kpiGrid}>
        <Kpi titulo="Progresso" valor={`${dados.progresso}%`} />
        <Kpi titulo="Treinos" valor={dados.treinosAluno.length} />
        <Kpi
          titulo="Exercícios"
          valor={`${dados.concluidos}/${dados.totalExercicios}`}
        />
        <Kpi
          titulo="Último peso"
          valor={ultima?.peso ? `${ultima.peso} kg` : '-'}
        />
        <Kpi titulo="IMC" valor={ultima?.imc || '-'} />
        <Kpi
          titulo="% Gordura"
          valor={ultima?.gordura ? `${ultima.gordura}%` : '-'}
        />
        <Kpi
          titulo="Massa magra"
          valor={ultima?.massaMagra ? `${ultima.massaMagra} kg` : '-'}
        />
      </div>

      <div style={styles.dashboardGrid}>
        <div style={styles.panel}>
          <h3>Avaliação física</h3>

          <label style={styles.label}>Data</label>
          <input
            style={styles.input}
            type="date"
            value={avaliacaoDraft.data}
            onChange={(e) => atualizarAvaliacao('data', e.target.value)}
          />

          <div style={styles.formGrid}>
            <CampoAvaliacao
              label="Peso kg"
              campo="peso"
              draft={avaliacaoDraft}
              atualizar={atualizarAvaliacao}
            />
            <CampoAvaliacao
              label="Altura cm ou m"
              campo="altura"
              draft={avaliacaoDraft}
              atualizar={atualizarAvaliacao}
            />
            <CampoAvaliacao
              label="Cintura cm"
              campo="cintura"
              draft={avaliacaoDraft}
              atualizar={atualizarAvaliacao}
            />
            <CampoAvaliacao
              label="Quadril cm"
              campo="quadril"
              draft={avaliacaoDraft}
              atualizar={atualizarAvaliacao}
            />
            <CampoAvaliacao
              label="Tórax cm"
              campo="torax"
              draft={avaliacaoDraft}
              atualizar={atualizarAvaliacao}
            />
            <CampoAvaliacao
              label="Braço cm"
              campo="braco"
              draft={avaliacaoDraft}
              atualizar={atualizarAvaliacao}
            />
            <CampoAvaliacao
              label="Coxa cm"
              campo="coxa"
              draft={avaliacaoDraft}
              atualizar={atualizarAvaliacao}
            />
            <CampoAvaliacao
              label="% gordura"
              campo="gordura"
              draft={avaliacaoDraft}
              atualizar={atualizarAvaliacao}
            />
            <CampoAvaliacao
              label="Massa magra kg"
              campo="massaMagra"
              draft={avaliacaoDraft}
              atualizar={atualizarAvaliacao}
            />
            <CampoAvaliacao
              label="IMC automático"
              campo="imc"
              draft={avaliacaoDraft}
              atualizar={atualizarAvaliacao}
            />
          </div>

          <label style={styles.label}>Observações da avaliação</label>
          <textarea
            style={styles.input}
            value={avaliacaoDraft.observacoes}
            onChange={(e) => atualizarAvaliacao('observacoes', e.target.value)}
            placeholder="Observações importantes da avaliação física"
          />

          <button
            style={styles.primary}
            onClick={() => salvarAvaliacaoAluno(aluno)}
          >
            Salvar avaliação
          </button>
        </div>

        <div style={styles.panel}>
          <h3>Evolução corporal</h3>
          <MiniGrafico
            titulo="Peso"
            dados={dados.avaliacoes}
            campo="peso"
            sufixo="kg"
          />
          <MiniGrafico
            titulo="% Gordura"
            dados={dados.avaliacoes}
            campo="gordura"
            sufixo="%"
          />
          <MiniGrafico
            titulo="Massa magra"
            dados={dados.avaliacoes}
            campo="massaMagra"
            sufixo="kg"
          />
        </div>
      </div>

      <div style={styles.dashboardGrid}>
        <div style={styles.panel}>
          <h3>Linha do tempo</h3>

          {dados.timeline.length === 0 && <p>Sem registros ainda.</p>}

          {dados.timeline.slice(0, 20).map((item: any, index: number) => (
            <div key={index} style={styles.timelineItem}>
              <b>{item.tipo}</b> - {item.titulo}
              <br />
              <small>{item.data}</small>
              <p>{item.detalhe}</p>
            </div>
          ))}
        </div>

        <div style={styles.panel}>
          <h3>Cargas registradas</h3>

          {dados.cargas.length === 0 && <p>Nenhuma carga registrada ainda.</p>}

          {dados.cargas.slice(0, 20).map((item: any, index: number) => (
            <div key={index} style={styles.timelineItem}>
              <b>{item.exercicio}</b>
              <p>
                {item.carga} | {item.treino}
              </p>
              <small>{item.data}</small>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.panel}>
        <h3>Histórico de avaliações</h3>

        {dados.avaliacoes.length === 0 && <p>Nenhuma avaliação salva.</p>}

        {dados.avaliacoes.map((avaliacao: any) => (
          <div key={avaliacao.id} style={styles.avaliacaoLinha}>
            <div>
              <b>{avaliacao.data}</b>
              <p>
                Peso: {avaliacao.peso || '-'} kg | Gordura:{' '}
                {avaliacao.gordura || '-'}% | Massa magra:{' '}
                {avaliacao.massaMagra || '-'} kg | IMC: {avaliacao.imc || '-'}
              </p>
              {avaliacao.observacoes && <small>{avaliacao.observacoes}</small>}
            </div>

            <div>
              <button
                style={styles.secondary}
                onClick={() => editarAvaliacao(avaliacao)}
              >
                Editar
              </button>
              <button
                style={styles.danger}
                onClick={() => excluirAvaliacaoAluno(aluno, avaliacao.id)}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Kpi({ titulo, valor }: any) {
  return (
    <div style={styles.kpiCard}>
      <small>{titulo}</small>
      <b>{valor}</b>
    </div>
  );
}

function CampoAvaliacao({ label, campo, draft, atualizar }: any) {
  return (
    <label style={styles.label}>
      {label}
      <input
        style={styles.input}
        value={draft[campo] || ''}
        onChange={(e) => atualizar(campo, e.target.value)}
      />
    </label>
  );
}

function MiniGrafico({ titulo, dados, campo, sufixo }: any) {
  const valores = [...(dados || [])]
    .reverse()
    .map((item: any) => ({
      data: item.data,
      valor: Number(String(item[campo] || '').replace(',', '.')),
    }))
    .filter((item) => !isNaN(item.valor) && item.valor > 0);

  if (valores.length < 2) {
    return (
      <div style={styles.graficoCard}>
        <b>{titulo}</b>
        <p>
          <small>Gráfico aparece após 2 avaliações.</small>
        </p>
      </div>
    );
  }

  const max = Math.max(...valores.map((v) => v.valor));
  const min = Math.min(...valores.map((v) => v.valor));
  const range = max - min || 1;

  const coords = valores
    .map((p, i) => {
      const x = (i / (valores.length - 1)) * 260;
      const y = 90 - ((p.valor - min) / range) * 75;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div style={styles.graficoCard}>
      <b>{titulo}</b>
      <svg width="280" height="105" viewBox="0 0 280 105">
        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="4"
          points={coords}
        />
        {valores.map((p, i) => {
          const x = (i / (valores.length - 1)) * 260;
          const y = 90 - ((p.valor - min) / range) * 75;
          return <circle key={i} cx={x} cy={y} r="4" fill="#16a34a" />;
        })}
      </svg>
      <small>
        Inicial: {valores[0].valor}
        {sufixo} | Atual: {valores[valores.length - 1].valor}
        {sufixo}
      </small>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg,#070B14 0%, #0F172A 100%)',
    color: '#ffffff',
    padding: 20,
    fontFamily: 'Arial',
  },
  container: { maxWidth: 1100, margin: '0 auto' },
  center: { textAlign: 'center' },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
    marginBottom: 20,
    gap: 10,
    flexWrap: 'wrap',
  },
  card: {
    background: '#111827',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    border: '1px solid #243041',
    boxShadow: '0 0 20px rgba(124,58,237,0.15)',
    color: 'white',
  },
  cardCompacto: {
    background: '#111827',
    borderRadius: 24,
    padding: 24,
    maxWidth: 500,
    margin: '40px auto',
    border: '1px solid #243041',
    color: 'white',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
    gap: 16,
  },
  treinoTabs: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  tab: {
    background: '#111827',
    border: '1px solid #243041',
    color: '#CBD5E1',
    borderRadius: 14,
    padding: '12px 18px',
    fontWeight: 700,
    cursor: 'pointer',
    marginRight: 8,
    marginBottom: 8,
  },
  tabAtiva: {
    background: 'linear-gradient(135deg,#7C3AED,#9333EA)',
    border: '1px solid #A855F7',
    color: 'white',
    borderRadius: 14,
    padding: '12px 18px',
    fontWeight: 800,
    cursor: 'pointer',
    marginRight: 8,
    marginBottom: 8,
    boxShadow: '0 0 18px rgba(124,58,237,0.35)',
  },
  treinoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  exercise: {
    background: '#111827',
    border: '1px solid #243041',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    color: 'white',
    boxShadow: '0 0 15px rgba(124,58,237,0.08)',
  },
  exerciseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  modelosBox: {
    marginTop: 18,
    marginBottom: 18,
    padding: 16,
    borderRadius: 18,
    background: '#0F172A',
    border: '1px solid #334155',
    color: 'white',
  },
  modelosHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  modelosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
    gap: 12,
  },
  modeloCard: {
    display: 'grid',
    gap: 8,
    padding: 14,
    borderRadius: 16,
    background: '#1E293B',
    border: '1px solid #334155',
  },
  exerciseTitleButton: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'left',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 14,
    border: '1px solid #243041',
    background: '#111827',
    color: 'white',
    outline: 'none',
    fontSize: 15,
    marginBottom: 14,
    boxSizing: 'border-box',
  },
  label: {
    color: '#CBD5E1',
    fontSize: 14,
    marginBottom: 6,
    display: 'block',
    fontWeight: 700,
  },
  primary: {
    background: 'linear-gradient(135deg,#7C3AED,#9333EA)',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    padding: '12px 18px',
    fontWeight: 800,
    cursor: 'pointer',
    margin: 4,
    boxShadow: '0 0 16px rgba(124,58,237,0.35)',
  },
  secondary: {
    background: '#1E293B',
    color: 'white',
    border: '1px solid #334155',
    borderRadius: 12,
    padding: '12px 16px',
    fontWeight: 700,
    cursor: 'pointer',
    margin: 4,
  },
  danger: {
    background: 'linear-gradient(135deg,#DC2626,#EF4444)',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    padding: '12px 18px',
    fontWeight: 800,
    cursor: 'pointer',
    margin: 4,
  },
  success: {
    background: 'linear-gradient(135deg,#16A34A,#22C55E)',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    padding: '12px 18px',
    fontWeight: 800,
    cursor: 'pointer',
    margin: 4,
  },
  messages: {
    marginTop: 20,
    padding: 15,
    background: '#f1f5f9',
    borderRadius: 12,
  },
  progressBg: {
    background: '#1E293B',
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    margin: '12px 0 18px',
  },
  progressFill: {
    background: 'linear-gradient(90deg,#7C3AED,#A855F7)',
    height: '100%',
    borderRadius: 999,
    transition: '0.3s',
  },
  ok: {
    padding: 10,
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 10,
    fontWeight: 'bold',
  },
  timerFixo: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    padding: 12,
    background: '#0f172a',
    color: 'white',
    borderRadius: 12,
    marginBottom: 15,
    boxShadow: '0 6px 16px rgba(0,0,0,.25)',
  },
  chartBox: {
    marginTop: 12,
    padding: 12,
    background: 'white',
    borderRadius: 12,
    border: '1px solid #cbd5e1',
  },
  alunoSelecionadoBox: {
    padding: 12,
    background: '#dbeafe',
    border: '1px solid #2563eb',
    borderRadius: 12,
    marginTop: 10,
  },
  professorTabs: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  alunoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
    gap: 14,
  },
  alunoCardGerenciar: {
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: 14,
    padding: 15,
    marginTop: 10,
  },
  alunoLinhaTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  alunoInfoLinha: { display: 'flex', alignItems: 'center', gap: 10 },
  alunoFotoMini: {
    width: 55,
    height: 55,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #2563eb',
  },
  contatoBox: {
    background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
    border: '1px solid #93c5fd',
    borderRadius: 14,
    padding: '10px 14px',
    marginBottom: 18,
    boxShadow: '0 4px 10px rgba(37,99,235,.08)',
    textAlign: 'center',
    fontSize: 13,
  },
  contatoLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: 14,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  contatoWhatsapp: {
    color: '#16a34a',
    textDecoration: 'none',
    fontWeight: 700,
  },
  contatoEmail: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 700,
  },
  configBox: {
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: 14,
    padding: 15,
    marginBottom: 18,
  },
  dashboardAluno: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    background: 'linear-gradient(135deg,#eff6ff,#f8fafc)',
    border: '1px solid #bfdbfe',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    background: 'white',
    border: '1px solid #cbd5e1',
    borderRadius: 14,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    boxShadow: '0 4px 12px rgba(15,23,42,.08)',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
    gap: 14,
    marginTop: 14,
  },
  panel: {
    background: 'white',
    border: '1px solid #cbd5e1',
    borderRadius: 14,
    padding: 14,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
    gap: 10,
  },
  timelineItem: {
    borderLeft: '4px solid #2563eb',
    padding: '8px 10px',
    marginBottom: 10,
    background: '#f8fafc',
    borderRadius: 10,
  },
  avaliacaoLinha: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
    border: '1px solid #cbd5e1',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    background: '#f8fafc',
  },
  graficoCard: {
    border: '1px solid #cbd5e1',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    background: '#f8fafc',
  },

  professorAdminCard: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },
  adminLinha: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    border: '1px solid #cbd5e1',
    borderRadius: 12,
    marginTop: 8,
    background: 'white',
  },
  inputLine: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  detailsBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    background: 'white',
    border: '1px solid #e2e8f0',
  },
  adminAlunoLinha: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    padding: 8,
    borderBottom: '1px solid #e2e8f0',
  },
  fotoPreview: {
    width: 90,
    height: 90,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #2563eb',
    marginBottom: 10,
  },

  mobileBottomNav: {
    position: 'fixed',
    left: 12,
    right: 12,
    bottom: 12,
    background: 'rgba(7, 11, 20, 0.96)',
    border: '1px solid #243041',
    borderRadius: 24,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6,
    padding: 8,
    zIndex: 9999,
    boxShadow: '0 -8px 30px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(14px)',
  },
  mobileNavItem: {
    background: 'transparent',
    color: '#94A3B8',
    border: 'none',
    borderRadius: 16,
    padding: '8px 4px',
    fontWeight: 800,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    fontSize: 12,
    cursor: 'pointer',
  },
  mobileNavActive: {
    background: 'linear-gradient(135deg,#7C3AED,#9333EA)',
    color: 'white',
    border: 'none',
    borderRadius: 16,
    padding: '8px 4px',
    fontWeight: 900,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    fontSize: 12,
    cursor: 'pointer',
    boxShadow: '0 0 18px rgba(124,58,237,.45)',
  },
  mobileHome: {
    color: 'white',
    paddingBottom: 90,
  },
  mobileHero: {
    background: 'linear-gradient(135deg,#111827,#172033)',
    border: '1px solid #243041',
    borderRadius: 28,
    padding: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    boxShadow: '0 0 24px rgba(124,58,237,.18)',
  },
  mobileAvatar: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #7C3AED',
  },
  mobileMuted: {
    color: '#94A3B8',
  },
  mobileStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginBottom: 16,
  },
  mobileStatCard: {
    background: '#111827',
    border: '1px solid #243041',
    borderRadius: 20,
    padding: 14,
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    boxShadow: '0 0 16px rgba(124,58,237,.10)',
  },
  mobileWorkoutCard: {
    background: 'linear-gradient(135deg,#111827,#0F172A)',
    border: '1px solid #243041',
    borderRadius: 26,
    padding: 18,
    color: 'white',
    boxShadow: '0 0 22px rgba(124,58,237,.15)',
  },
  mobilePrimaryFull: {
    width: '100%',
    background: 'linear-gradient(135deg,#7C3AED,#9333EA)',
    color: 'white',
    border: 'none',
    borderRadius: 18,
    padding: '16px 18px',
    fontWeight: 900,
    cursor: 'pointer',
    marginTop: 10,
    boxShadow: '0 0 18px rgba(124,58,237,.35)',
  },

  mobileMenuButton: {
    position: 'fixed',
    top: 18,
    left: 18,
    zIndex: 2147483647,
    width: 52,
    height: 52,
    borderRadius: 18,
    border: '1px solid #7C3AED',
    background: 'linear-gradient(135deg,#111827,#1E293B)',
    color: 'white',
    fontSize: 26,
    fontWeight: 900,
    boxShadow: '0 0 22px rgba(124,58,237,.45)',
    backdropFilter: 'blur(12px)',
    cursor: 'pointer',
  },
  sideOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.62)',
    zIndex: 10000,
    backdropFilter: 'blur(8px)',
  },
  sideMenu: {
    width: '82%',
    maxWidth: 340,
    height: '100%',
    background: 'linear-gradient(180deg,#070B14,#0F172A)',
    borderRight: '1px solid #243041',
    padding: 18,
    boxSizing: 'border-box',
    color: 'white',
    boxShadow: '20px 0 50px rgba(0,0,0,.45)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  sideHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sideLogo: {
    fontSize: 22,
    fontWeight: 900,
    color: 'white',
  },
  sideClose: {
    width: 40,
    height: 40,
    borderRadius: 14,
    border: '1px solid #243041',
    background: '#111827',
    color: 'white',
    fontSize: 28,
    cursor: 'pointer',
  },
  sideProfile: {
    background: 'linear-gradient(135deg,#111827,#172033)',
    border: '1px solid #243041',
    borderRadius: 22,
    padding: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  sideAvatar: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #7C3AED',
  },
  sideAvatarFallback: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#1E293B',
    display: 'grid',
    placeItems: 'center',
    fontSize: 26,
    border: '2px solid #7C3AED',
  },
  sideOnline: {
    display: 'inline-block',
    marginTop: 4,
    color: '#22C55E',
    fontSize: 12,
    fontWeight: 800,
  },
  sideOffline: {
    display: 'inline-block',
    marginTop: 4,
    color: '#F97316',
    fontSize: 12,
    fontWeight: 800,
  },
  sideMenuItem: {
    width: '100%',
    border: '1px solid transparent',
    background: 'transparent',
    color: '#CBD5E1',
    borderRadius: 16,
    padding: '14px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 15,
    cursor: 'pointer',
    textAlign: 'left',
  },
  sideMenuItemActive: {
    width: '100%',
    border: '1px solid #7C3AED',
    background: 'linear-gradient(135deg,rgba(124,58,237,.45),rgba(147,51,234,.28))',
    color: 'white',
    borderRadius: 16,
    padding: '14px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 15,
    cursor: 'pointer',
    textAlign: 'left',
    boxShadow: '0 0 18px rgba(124,58,237,.25)',
  },
  sideLogout: {
    marginTop: 'auto',
    width: '100%',
    background: 'linear-gradient(135deg,#DC2626,#EF4444)',
    color: 'white',
    border: 'none',
    borderRadius: 16,
    padding: '14px',
    fontWeight: 900,
    cursor: 'pointer',
  },
  statsWorkoutLine: {
    background: '#0B1020',
    border: '1px solid #243041',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  messageCardPremium: {
    background: '#0B1020',
    border: '1px solid #243041',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },

  videoBox: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    background: '#020617',
    border: '1px solid #243041',
    margin: '14px 0',
    aspectRatio: '16 / 9',
  },
  videoFrame: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
    background: '#020617',
  },
  videoEmpty: {
    width: '100%',
    minHeight: 96,
    borderRadius: 18,
    background: '#020617',
    border: '1px solid #243041',
    color: '#CBD5E1',
    display: 'grid',
    placeItems: 'center',
    margin: '14px 0',
    fontWeight: 800,
    textAlign: 'center',
  }
};