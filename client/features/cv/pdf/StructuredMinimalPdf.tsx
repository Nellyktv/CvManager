import { Document, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import type { CvContent } from '../../../shared/types/cv';
import { formatCvDateRange } from '../../../shared/utils/formatDate';
import { groupSkills } from '../preview/groupSkills';
import { markdownToPdf } from './markdownToPdf';

type Props = {
  content: CvContent;
  labels: {
    contact: string;
    skills: string;
    education: string;
    projects: string;
  };
  locale: 'en' | 'ru';
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1c1f24',
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#334155',
    color: '#f8fafc',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  name: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#f8fafc',
    marginBottom: 3,
  },
  headline: {
    fontSize: 10,
    color: '#f8fafc',
    marginBottom: 8,
  },
  contactHeading: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#cbd5e1',
    marginBottom: 3,
  },
  contactLine: {
    fontSize: 9,
    color: '#f8fafc',
  },
  contactSep: {
    color: '#94a3b8',
  },
  contactLink: {
    color: '#cbd5e1',
    textDecoration: 'underline',
  },
  body: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 16,
  },
  projectsCol: {
    flex: 1.35,
  },
  sideCol: {
    flex: 1,
  },
  railHeading: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: '#5a6570',
    borderBottomWidth: 1,
    borderBottomColor: '#cfd5db',
    paddingBottom: 3,
    marginBottom: 8,
  },
  project: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  projectTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  meta: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 3,
  },
  link: {
    fontSize: 9,
    color: '#1d4ed8',
    textDecoration: 'underline',
    marginBottom: 2,
  },
  groupLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    marginBottom: 2,
  },
  item: {
    fontSize: 9,
    marginBottom: 2,
  },
  section: {
    marginBottom: 14,
  },
});

const StructuredMinimalPdf = ({ content, labels, locale }: Props) => {
  const { contact, skills, education, projects } = content;
  const skillBuckets = groupSkills(skills);

  const contactBits: Array<{ text: string; url?: string }> = [
    ...(contact.email ? [{ text: contact.email }] : []),
    ...(contact.phone ? [{ text: contact.phone }] : []),
    ...(contact.location ? [{ text: contact.location }] : []),
    ...contact.links.map((link) => ({ text: link.label, url: link.url })),
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} wrap={false}>
          <Text style={styles.name}>{contact.name}</Text>
          {contact.headline ? <Text style={styles.headline}>{contact.headline}</Text> : null}
          <Text style={styles.contactHeading}>{labels.contact}</Text>
          <Text style={styles.contactLine}>
            {contactBits.map((bit, index) => (
              <Text key={`${bit.text}-${index}`}>
                {index > 0 ? <Text style={styles.contactSep}> · </Text> : null}
                {bit.url ? (
                  <Link src={bit.url} style={styles.contactLink}>
                    {bit.text}
                  </Link>
                ) : (
                  bit.text
                )}
              </Text>
            ))}
          </Text>
        </View>

        <View style={styles.body}>
          {projects.length > 0 ? (
            <View style={styles.projectsCol}>
              <Text style={styles.railHeading}>{labels.projects}</Text>
              {projects.map((project) => {
                const dates = formatCvDateRange(project.startDate, project.endDate, locale);
                return (
                  <View
                    key={`${project.title}-${project.startDate ?? ''}`}
                    style={styles.project}
                  >
                    <View wrap={false}>
                      <Text style={styles.projectTitle}>{project.title}</Text>
                      {project.role || dates ? (
                        <Text style={styles.meta}>
                          {[project.role, dates].filter(Boolean).join(' · ')}
                        </Text>
                      ) : null}
                    </View>
                    {project.links.map((link) => (
                      <Link key={link.url} src={link.url} style={styles.link}>
                        {link.label}
                      </Link>
                    ))}
                    {markdownToPdf(project.descriptionMarkdown)}
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={projects.length > 0 ? styles.sideCol : { flex: 1 }}>
            {skillBuckets.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.railHeading}>{labels.skills}</Text>
                {skillBuckets.map((bucket) => (
                  <View key={bucket.group ?? '__ungrouped'} style={{ marginBottom: 6 }}>
                    {bucket.group ? (
                      <Text style={styles.groupLabel}>{bucket.group}</Text>
                    ) : null}
                    {bucket.skills.map((skill) => (
                      <Text key={skill.label} style={styles.item}>
                        • {skill.label}
                        {skill.value ? ` — ${skill.value}` : ''}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}

            {education.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.railHeading}>{labels.education}</Text>
                {education.map((entry) => {
                  const dates = formatCvDateRange(entry.startDate, entry.endDate, locale);
                  return (
                    <View
                      key={`${entry.institution}-${entry.startDate ?? ''}`}
                      style={{ marginBottom: 8 }}
                      wrap={false}
                    >
                      <Text style={{ ...styles.item, fontFamily: 'Helvetica-Bold' }}>
                        {entry.institution}
                      </Text>
                      {[entry.degree, entry.field].filter(Boolean).length > 0 ? (
                        <Text style={styles.item}>
                          {[entry.degree, entry.field].filter(Boolean).join(', ')}
                        </Text>
                      ) : null}
                      {entry.location ? (
                        <Text style={styles.item}>{entry.location}</Text>
                      ) : null}
                      {dates ? <Text style={styles.item}>{dates}</Text> : null}
                      {entry.description ? (
                        <Text style={styles.item}>{entry.description}</Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default StructuredMinimalPdf;
