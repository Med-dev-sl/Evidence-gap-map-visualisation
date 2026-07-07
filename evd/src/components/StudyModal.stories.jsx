import StudyModal from "./StudyModal";

const sampleStudies = [
  {
    title: "CCTs and Household Income: Evidence from Oportunidades",
    authors: "Fiszbein, A. & Schady, N.",
    year: 2009,
    journal: "World Bank Research Observer",
  },
  {
    title: "Long-Term Impacts of Conditional Cash Transfers on Poverty",
    authors: "Barrientos, A. & Dejong, J.",
    year: 2006,
    journal: "Journal of Development Studies",
  },
  {
    title: "Conditional Cash Transfers and School Enrollment in Latin America",
    authors: "Baird, S. et al.",
    year: 2011,
    journal: "Economic Journal",
  },
];

export default {
  title: "Components/StudyModal",
  component: StudyModal,
  tags: ["autodocs"],
};

export const MultipleStudies = {
  args: {
    studies: sampleStudies,
    intervention: "Conditional Cash Transfers",
    outcome: "Income / Poverty",
    onClose: () => {},
  },
};

export const SingleStudy = {
  args: {
    studies: [sampleStudies[0]],
    intervention: "Conditional Cash Transfers",
    outcome: "Income / Poverty",
    onClose: () => {},
  },
};
