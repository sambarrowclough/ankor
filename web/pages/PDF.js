// import {
//   PDFDownloadLink,
//   Text,
//   Document,
//   Page,
//   StyleSheet,
//   View
// } from '@react-pdf/renderer'
// import { useState, useEffect } from 'react'
// import { useAppContext } from '../utils/useApp'
// import dynamic from 'next/dynamic'

// export const styles = StyleSheet.create({
//   body: {
//     padding: 10
//   },
//   table: {
//     display: 'table',
//     width: 'auto'
//   },
//   tableRow: {
//     margin: 'auto',
//     flexDirection: 'row'
//   },
//   tableColHeader: {
//     width: '16.6%',
//     borderStyle: 'solid',
//     color: '#999',
//     fontSize: 10,
//     fontWeight: 400
//   },
//   tableCol: {
//     width: '16.6%',
//     borderStyle: 'solid',
//     borderColor: '#eee',
//     borderWidth: 1,
//     borderLeftWidth: 0,
//     borderRightWidth: 0,
//     borderTopWidth: 0,
//     paddingBottom: 6,
//     paddingTop: 6,
//     color: '#222'
//   },
//   tableCellHeader: {
//     margin: 'auto',
//     margin: 5,
//     fontSize: 12,
//     fontWeight: 500
//   },
//   tableCell: {
//     margin: 'auto',
//     margin: 5,
//     fontSize: 10
//   },
//   date: {
//     fontSize: '14px',
//     marginBottom: '30px',
//     marginLeft: '5px',
//     color: '#666'
//   },
//   total: {
//     fontSize: '14px',
//     marginBottom: '10px',
//     marginLeft: '5px',
//     color: '#666'
//   }
// })

// export const Report = ({ issues }) => (
//   <Document>
//     <Page style={styles.body}>
//       <View>
//         <Text style={styles.total}>Total: 06h 28m</Text>
//       </View>
//       <View>
//         <Text style={styles.date}>01/01/2021 - 12/31/2021</Text>
//       </View>
//       <View style={styles.table}>
//         <View style={styles.tableRow}>
//           <View style={styles.tableColHeader}>
//             <Text style={styles.tableCellHeader}>Date</Text>
//           </View>
//           <View style={styles.tableColHeader}>
//             <Text style={styles.tableCellHeader}>Issue</Text>
//           </View>
//           <View style={styles.tableColHeader}>
//             <Text style={styles.tableCellHeader}>Project</Text>
//           </View>
//           <View style={styles.tableColHeader}>
//             <Text style={styles.tableCellHeader}>Cycle</Text>
//           </View>
//           <View style={styles.tableColHeader}>
//             <Text style={styles.tableCellHeader}>Assignee</Text>
//           </View>
//           <View style={styles.tableColHeader}>
//             <Text style={styles.tableCellHeader}>Duration</Text>
//           </View>
//         </View>

//         {issues.map((issue, index) => {
//           return (
//             <View style={styles.tableRow}>
//               <View style={styles.tableCol}>
//                 <Text style={styles.tableCell}>
//                   {new Date(issue.createdAt).toDateString()}
//                 </Text>
//               </View>
//               <View style={styles.tableCol}>
//                 <Text style={styles.tableCell}>{issue.title}</Text>
//               </View>
//               <View style={styles.tableCol}>
//                 <Text style={styles.tableCell}>{issue.projectId}</Text>
//               </View>
//               <View style={styles.tableCol}>
//                 <Text style={styles.tableCell}>{issue.cycleId}</Text>
//               </View>
//               <View style={styles.tableCol}>
//                 <Text style={styles.tableCell}>{issue.assigneeId}</Text>
//               </View>
//               <View style={styles.tableCol}>
//                 <Text style={styles.tableCell}>{issue.duration}</Text>
//               </View>
//             </View>
//           )
//         })}
//       </View>
//     </Page>
//   </Document>
// )

// export default function App() {
//   const [isClient, setIsClient] = useState(false)
//   const { issues } = useAppContext()
//   console.log(issues)
//   useEffect(() => {
//     setIsClient(true)
//   }, [])
//   return (
//     <div>
//       {isClient && (
//         <PDFDownloadLink
//           document={<Report issues={issues} />}
//           fileName="Report.pdf"
//         >
//           {({ blob, url, loading, error }) =>
//             loading ? 'Loading document...' : 'Download my resume'
//           }
//         </PDFDownloadLink>
//       )}
//     </div>
//   )
// }
