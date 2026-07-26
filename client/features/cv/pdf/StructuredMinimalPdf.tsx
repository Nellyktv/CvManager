import { Document, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import type { CvContent } from '../../../shared/types/cv';
import { formatCvDateRange } from '../../../shared/utils/formatDate';
import { groupSkills } from '../preview/groupSkills';
import { isSafeUrl } from '../../../shared/utils/isSafeUrl';
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

const COLORS = {
  pageText: '#1c1f24',
  pageBg: '#ffffff',
  headerBg: '#334155',
  headerText: '#f8fafc',
  mutedLight: '#cbd5e1',
  contactSep: '#94a3b8',
  railHeading: '#5a6570',
  railBorder: '#cfd5db',
  projectBorder: '#e5e7eb',
  metaText: '#4b5563',
  linkColor: '#1d4ed8',
  groupLabel: '#374151',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLORS.pageText,
    backgroundColor: COLORS.pageBg,
  },
  header: {
    backgroundColor: COLORS.headerBg,
    color: COLORS.headerText,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  name: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.headerText,
    marginBottom: 3,
  },
  headline: {
    fontSize: 10,
    color: COLORS.headerText,
    marginBottom: 8,
  },
  contactHeading: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.mutedLight,
    marginBottom: 3,
  },
  contactLine: {
    fontSize: 9,
    color: COLORS.headerText,
  },
  contactSep: {
    color: COLORS.contactSep,
  },
  contactLink: {
    color: COLORS.mutedLight,
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
    color: COLORS.railHeading,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.railBorder,
    paddingBottom: 3,
    marginBottom: 8,
  },
  project: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.projectBorder,
  },
  projectTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  meta: {
    fontSize: 9,
    color: COLORS.metaText,
    marginBottom: 3,
  },
  link: {
    fontSize: 9,
    color: COLORS.linkColor,
    textDecoration: 'underline',
    marginBottom: 2,
  },
  groupLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.groupLabel,
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
                {bit.url && isSafeUrl(bit.url) ? (
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
                    {project.links.map((link) =>
                      isSafeUrl(link.url) ? (
                        <Link key={link.url} src={link.url} style={styles.link}>
                          {link.label}
                        </Link>
                      ) : (
                        <Text key={link.url} style={styles.link}>
                          {link.label}
                        </Text>
                      ),
                    )}
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
