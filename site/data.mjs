// Content for the site: papers, questions, software, experience. Facts from the papers and the CV.

export const PAPERS = [
  {
    id: "embc2022", headline: ["14 joints", "predicted from forearm EMG, 2.78° mean absolute error"], line: "Offline prediction of 14 hand joint angles from forearm EMG.", act: 0, pub: "IEEE", venue: "EMBC", year: "2022",
    short: "Predicting 14 degrees of freedom of the hand",
    figAlt: "Camera setup, raw HD-sEMG, the 3D convolutional network and predicted joint angles",
    title: "Accurate continuous prediction of 14 degrees of freedom of the hand from myoelectrical signals through convolutive deep learning",
    meta: "44th IEEE EMBC · Glasgow, July 2022",
    me: "Raul C. Sîmpetru", others: ", Marius Osswald, Dominik I. Braun, Daniela S. Oliveira, Andre L. Cakici, Alessandro Del Vecchio",
    links: [["Paper", "Read it on IEEE Xplore", "https://ieeexplore.ieee.org/document/9870937"]],
  },
  {
    id: "tnsre2023", headline: [">20 DoF", "decoded live, under 50 ms latency, 32 predictions a second"], line: "Real-time decoding of more than 20 degrees of freedom at 32 predictions per second.", act: 0, pub: "IEEE", venue: "TNSRE", year: "2023",
    short: "Real-time control of the full human hand",
    figAlt: "Neural-to-EMG pathway and real-time hand-kinematics estimates compared with camera-based estimates",
    title: "Proportional and simultaneous real-time control of the full human hand from high-density electromyography",
    meta: "IEEE Trans. Neural Syst. Rehabil. Eng. 31 · July 2023",
    me: "Raul C. Sîmpetru", others: ", Michael März, Alessandro Del Vecchio",
    links: [
      ["Video", "Watch the virtual hand follow, in real time", "https://www.youtube.com/watch?v=8tjoi3-rZU0&list=PLkpLOrBUAGCFQtzjLwz4_Yisga19Kt4uJ"],
      ["Paper", "Read it on IEEE Xplore", "https://ieeexplore.ieee.org/document/10182328"],
    ],
  },
  {
    id: "jne2024", headline: ["320", "electrodes; best with all of them and no low-pass filtering"], line: "Among the tested configurations, estimation performed best with all 320 channels and no low-pass filtering.", act: 1, pub: "IOP", venue: "J. Neural Eng.", year: "2024",
    short: "Effects of EMG filtering on hand-kinematics estimation",
    figAlt: "Neural information, movements and EMG, then filtering, a neural network and a comparison of filters",
    title: "Influence of spatio-temporal filtering on hand kinematics estimation from high-density EMG signals",
    meta: "J. Neural Eng. 21 · March 2024 · Open access",
    me: "Raul C. Sîmpetru", others: ", Vlad Cnejevici, Dario Farina, Alessandro Del Vecchio",
    links: [
      ["Paper · Open access", "Read it free on IOPscience", "https://iopscience.iop.org/article/10.1088/1741-2552/ad3498"],
      ["Preprint", "The preprint, whose title gives away the ending", "https://doi.org/10.36227/techrxiv.23709231.v1"],
    ],
  },
  {
    id: "tbme2024", headline: ["22 DoF", "kinematics and force from 320 EMG sensors"], line: "The network's internal representations organise muscle activity by finger.", act: 1, pub: "IEEE", venue: "TBME", year: "2024",
    short: "Learning a hand model from dynamic movements",
    figAlt: "Neural pathway, the movement set, electrode grid placement and the 22-degree-of-freedom hand model",
    title: "Learning a hand model from dynamic movements using high-density EMG and convolutional neural networks",
    meta: "IEEE Trans. Biomed. Eng. 71 · 2024",
    me: "Raul C. Sîmpetru", others: ", Andreas Arkudas, Dominik I. Braun, Marius Osswald, Daniela Souza de Oliveira, Bjoern Eskofier, Thomas M. Kinfe, Alessandro Del Vecchio",
    links: [
      ["Article", "The IEEE EMBS write-up of the paper", "https://www.embs.org/tbme/articles/learning-a-hand-model-from-dynamic-movements-using-high-density-emg-and-convolutional-neural-networks/"],
      ["Code", "The network and training code", "https://github.com/RaulSimpetru/Sensing-the-Full-Dynamics-of-the-Human-Hand-with-a-Neural-Interface-and-Deep-Learning"],
      ["Paper · Open access", "Read it on IEEE Xplore", "https://ieeexplore.ieee.org/document/10607959"],
    ],
  },
  {
    id: "tnsre2024", headline: ["98.3%", "mean accuracy across 8 attempted movements, 8 tetraplegic participants"], line: "Usable muscle activity after motor-complete spinal cord injury.", act: 2, pub: "IEEE", venue: "TNSRE", year: "2024",
    short: "Spared motor dimensions after motor-complete spinal cord injury",
    figAlt: "Uninjured and motor-complete SCI participants, EMG and kinematics feed a deep learning model whose latent space separates gestures and groups",
    title: "Identification of spared and proportionally controllable hand motor dimensions in motor complete spinal cord injuries using latent manifold analysis",
    meta: "IEEE Trans. Neural Syst. Rehabil. Eng. 32 · October 2024 · Open access",
    me: "Raul C. Sîmpetru", others: ", Daniela Souza de Oliveira, Matthias Ponfick, Alessandro Del Vecchio",
    links: [["Paper · Open access", "Read it on IEEE Xplore", "https://ieeexplore.ieee.org/document/10703163"]],
  },
  {
    id: "sciadv2025", headline: ["7 participants", "control demonstrated with a virtual hand, orthosis, prosthesis and cursor"], line: "A wireless EMG bracelet and open software for people with neural lesions.", act: 2, pub: "Science", venue: "Science Advances", year: "2025",
    short: "MyoGestic",
    figAlt: "A participant wearing the EMG bracelet controls a virtual hand, an orthosis, a prosthesis and a cursor",
    title: "MyoGestic: EMG interfacing framework for decoding multiple spared motor dimensions in individuals with neural lesions",
    meta: "Sci. Adv. 11, eads9150 · April 2025",
    me: "Raul C. Sîmpetru†", others: ", Dominik I. Braun†, Arndt U. Simon, Michael März, Vlad Cnejevici, Daniela Souza de Oliveira, Nico Weber, Jonas Walter, Jörg Franke, Daniel Höglinger, Cosima Prahm, Matthias Ponfick, Alessandro Del Vecchio († equal contribution)",
    links: [
      ["Paper", "Read it on science.org", "https://www.science.org/doi/10.1126/sciadv.ads9150"],
      ["Code", "MyoGestic, open source", "https://github.com/NsquaredLab/MyoGestic"],
      ["Archive", "v0.1.0 on Zenodo, the exact version from the paper", "https://doi.org/10.5281/zenodo.14020173"],
    ],
  },
  {
    id: "myogen2026", headline: ["Cortex to EMG", "simulation of neural drive, muscle force, and surface and intramuscular EMG"], line: "Open-source simulation from neural drive to EMG.", act: 3, pub: "Preprint", venue: "bioRxiv", year: "2026",
    short: "MyoGen",
    figAlt: "Cortical neurons, interneurons, motor neurons, afferents, a Hill-type muscle, volume conductor and resulting surface and intramuscular EMG",
    title: "MyoGen: unified biophysical modeling of human neuromotor activity and resulting signals",
    meta: "bioRxiv · January 2026",
    me: "Raul C. Sîmpetru*", others: ", Ricardo G. Molinari*, Devon R. Rohlf, Rebeka L. Batichotti, Renato N. Watanabe, Leonardo A. Elias, Alessandro Del Vecchio (* joint first authors)",
    links: [
      ["Preprint", "Read the preprint on bioRxiv", "https://www.biorxiv.org/content/10.64898/2026.01.01.697284v1"],
      ["Docs", "MyoGen documentation", "https://nsquaredlab.github.io/MyoGen/"],
      ["Code", "NsquaredLab/MyoGen", "https://github.com/NsquaredLab/MyoGen"],
    ],
  },
];

export const ACTS = [
  { title: "Decoding hand kinematics from EMG" },
  { title: "Filtering and learned representations" },
  { title: "Assistive control after injury or amputation" },
  { title: "Biophysical simulation of neuromotor activity" },
];

export const QUESTIONS = [
  {
    q: "Decoding hand movement from forearm EMG", label: "Decoding",
    fig: "tbme2024", figAlt: "From spinal motor neurons to a 22-degree-of-freedom hand model",
    answer: "We use forearm muscle recordings to estimate hand movement in real time, then investigate what the network learns.",
    papers: ["tnsre2023", "tbme2024", "jne2024"],
  },
  {
    q: "Decoding spared muscle activity for assistive control", label: "MyoGestic",
    fig: "sciadv2025", figAlt: "A participant wearing the EMG bracelet controls a virtual hand, an orthosis, a prosthesis and a cursor",
    answer: "We train decoders with participants to turn spared muscle activity into control of assistive devices.",
    papers: ["tnsre2024", "sciadv2025"],
  },
  {
    q: "Simulating neural drive, muscle and EMG", label: "MyoGen",
    fig: "myogen2026", figAlt: "Cortical neurons, spinal motor neurons, afferents, muscle and the resulting EMG, simulated",
    answer: "MyoGen links models of neural drive, muscle and EMG, letting us test decoders against known simulated signals.",
    papers: ["myogen2026"],
  },
];

export const CAST = [
  ["2026", "Co-located ultrasound and tattoo-electrode sEMG for hand gesture decoding", "Tillaeva et al. · IEEE CBS · in press", ""],
  ["2026", "Physiological and pathological motor unit phenotypes coexist within single motor pools after cervical SCI", "Rohlf et al. · preprint", "https://doi.org/10.64898/2026.06.04.730075"],
  ["2026", "MyoKin3X: a myoelectric framework for full-hand 3D force recording", "Rohleder et al. · IEEE CBS · Best Student Paper", "https://doi.org/10.48550/arXiv.2604.27949"],
  ["2026", "Voluntary dissociation of motor unit activity in the vastii muscles", "Haller et al. · J. Neurosci.", "https://doi.org/10.1523/JNEUROSCI.1982-25.2026"],
  ["2026", "Simultaneous control of human hand joint positions and grip force via HD-sEMG and deep learning", "Rahimi et al. · IEEE Access", "https://doi.org/10.1109/ACCESS.2026.3692583"],
  ["2025", "Closed-loop neuroprosthetic control through spared neural activity enables proportional foot movements after spinal cord injury", "Cnejevici et al. · arXiv", "https://doi.org/10.48550/arXiv.2506.16468"],
  ["2024", "Bridging the gap between experimental control and ecological validity in human sensorimotor science", "Tsay et al. · J. Physiol.", "https://doi.org/10.1113/JP287037"],
  ["2024", "Analysis of embedded GPU architectures for AI in neuromuscular applications", "Pfenning et al. · IJCSIS", "https://doi.org/10.33965/ijcsis_2024190101"],
  ["2024", "Gaitmap: an open ecosystem for IMU-based human gait analysis and algorithm benchmarking", "Küderle et al. · IEEE OJEMB", "https://doi.org/10.1109/OJEMB.2024.3356791"],
  ["2023", "tpcp: tiny pipelines for complex problems", "Küderle et al. · JOSS", "https://doi.org/10.21105/joss.04953"],
  ["2023", "Evaluation of GPU-centric embedded architectures in the field of neuromuscular EMG-based AI", "Pfenning et al. · IADIS AC", "https://doi.org/10.33965/ICWI_AC_2023_202307L005"],
  ["2022", "A generalized framework for the study of spinal motor neurons controlling the human hand during dynamic movements", "Cakici et al. · IEEE EMBC", "https://doi.org/10.1109/EMBC48229.2022.9870914"],
];

export const SOFTWARE = [
  { name: "MyoGestic", logo: "img/logo-myogestic.png", rule: "crimson", text: "Real-time myocontrol software with decoder calibration during participant sessions.", role: "Co-creator and core developer · v2.0, 2026", links: [["Docs", "https://nsquaredlab.github.io/MyoGestic/"], ["GitHub", "https://github.com/NsquaredLab/MyoGestic"], ["Zenodo", "https://doi.org/10.5281/zenodo.20257631"]] },
  { name: "MyoGen", logo: "img/logo-myogen.png", rule: "lilac", text: "Biophysical simulation from neural drive to EMG.", role: "Author and maintainer · v0.11.0", install: "pip install myogen", links: [["Docs", "https://nsquaredlab.github.io/MyoGen/"], ["GitHub", "https://github.com/NsquaredLab/MyoGen"]] },
];

// Experience, compact: one line per fact, [main, sub, optional link]; the full CV is a link.
export const FACTS = [
  ["Now", [["Doctoral researcher", "n-squared lab, FAU Erlangen-Nürnberg"], ["Invited professor", "Kutaisi International University"]]],
  ["Before", [["Research and teaching assistant", "FAU Erlangen-Nürnberg"], ["Research assistant", "Fraunhofer IIS"]]],
  ["Education", [["Dr.-Ing. candidate", "Defence expected December 2026"], ["MSc and BSc Medical Engineering", "FAU Erlangen-Nürnberg"]]],
  ["Teaching", [["Neurocomputing, robotics, deep learning, DSP", "Kutaisi International University"], ["Seminars and thesis supervision", "FAU Erlangen-Nürnberg"]]],
  ["Recognition", [["Best Student Paper, co-author", "IEEE CBS 2026"], ["Featured Article", "IEEE TBME 2024"], ["Young Talent Award, 3rd prize", "DMEA 2023"]]],
  ["Talks", [["Public lecture: Muscles, Machines, and Movement", "Georgian Technical University, Tbilisi 2026", "https://www.nsquared.tf.fau.de/2026/10/12/georgian-and-international-early-career-researchers-deliver-public-lectures-on-biomedical-engineering-at-georgian-technical-university/"], ["Invited symposium talk", "ISEK 2026"], ["Rapid-fire talk", "International Motoneuron Society 2025"], ["Oral talk", "ISEK 2024"], ["Selected oral talk", "The Physiological Society 2023"]]],
];
