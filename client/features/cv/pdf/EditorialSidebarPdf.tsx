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
    flexDirection: 'row',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1a1a1a',
  },
  sidebar: {
    width: '32%',
    backgroundColor: '#1f3a4c',
    color: '#f4f8fb',
    paddingHorizontal: 14,
    paddingVertical: 20,
  },
  main: {
    width: '68%',
    paddingHorizontal: 18,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
  },
  sectionHeading: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#d7e6ef',
    marginBottom: 6,
  },
  mainHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#3d5a6c',
    borderBottomWidth: 1,
    borderBottomColor: '#c5d5e0',
    paddingBottom: 4,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#152937',
    marginBottom: 4,
  },
  headline: {
    fontSize: 11,
    color: '#3d5a6c',
    marginBottom: 14,
  },
  sidebarText: {
    fontSize: 9,
    color: '#f4f8fb',
    marginBottom: 3,
  },
  sidebarLink: {
    fontSize: 9,
    color: '#9ed0ea',
    textDecoration: 'none',
    marginBottom: 2,
  },
  mainLink: {
    fontSize: 9,
    color: '#152937',
    textDecoration: 'underline',
    marginBottom: 2,
  },
  groupLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
    marginBottom: 2,
  },
  projectTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#152937',
    marginBottom: 2,
  },
  meta: {
    fontSize: 9,
    color: '#4a6070',
    marginBottom: 3,
  },
  section: {
    marginBottom: 14,
  },
  project: {
    marginBottom: 12,
  },
});

const EditorialSidebarPdf = ({ content, labels, locale }: Props) => {
  const { contact, skills, education, projects } = content;
  const skillBuckets = groupSkills(skills);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.sidebar}>
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{labels.contact}</Text>
            {contact.email ? <Text style={styles.sidebarText}>{contact.email}</Text> : null}
            {contact.phone ? <Text style={styles.sidebarText}>{contact.phone}</Text> : null}
            {contact.location ? (
              <Text style={styles.sidebarText}>{contact.location}</Text>
            ) : null}
            {contact.links.map((link) => (
              <Link key={link.url} src={link.url} style={styles.sidebarLink}>
                {link.label}
              </Link>
            ))}
          </View>

          {skillBuckets.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>{labels.skills}</Text>
              {skillBuckets.map((bucket) => (
                <View key={bucket.group ?? '__ungrouped'}>
                  {bucket.group ? (
                    <Text style={styles.groupLabel}>{bucket.group}</Text>
                  ) : null}
                  {bucket.skills.map((skill) => (
                    <Text key={skill.label} style={styles.sidebarText}>
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
              <Text style={styles.sectionHeading}>{labels.education}</Text>
              {education.map((entry) => {
                const dates = formatCvDateRange(entry.startDate, entry.endDate, locale);
                return (
                  <View
                    key={`${entry.institution}-${entry.startDate ?? ''}`}
                    style={{ marginBottom: 8 }}
                    wrap={false}
                  >
                    <Text style={{ ...styles.sidebarText, fontFamily: 'Helvetica-Bold' }}>
                      {entry.institution}
                    </Text>
                    {[entry.degree, entry.field].filter(Boolean).length > 0 ? (
                      <Text style={styles.sidebarText}>
                        {[entry.degree, entry.field].filter(Boolean).join(', ')}
                      </Text>
                    ) : null}
                    {entry.location ? (
                      <Text style={styles.sidebarText}>{entry.location}</Text>
                    ) : null}
                    {dates ? <Text style={styles.sidebarText}>{dates}</Text> : null}
                    {entry.description ? (
                      <Text style={styles.sidebarText}>{entry.description}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>

        <View style={styles.main}>
          <View style={{ marginBottom: 14 }} wrap={false}>
            <Text style={styles.name}>{contact.name}</Text>
            {contact.headline ? (
              <Text style={styles.headline}>{contact.headline}</Text>
            ) : null}
          </View>

          {projects.length > 0 ? (
            <View>
              <Text style={styles.mainHeading}>{labels.projects}</Text>
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
                      <Link key={link.url} src={link.url} style={styles.mainLink}>
                        {link.label}
                      </Link>
                    ))}
                    {markdownToPdf(project.descriptionMarkdown)}
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
};

export default EditorialSidebarPdf;
