import { PrismaClient, Role, EmployeeType, Gender, StudentStatus, PaymentStatus, AttendanceStatus, TermType, ExamType, GradeScale, FeeCategory, PaymentMethod, Priority, Audience, PromotionStatus, DiscountType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive seed...')

  // Clear existing data - MUST delete in correct order (child tables first)
  console.log('🧹 Cleaning up existing data...')
  
  // Delete in order of dependencies based on actual schema
  await prisma.assessmentScore.deleteMany()
  await prisma.assessment.deleteMany()
  await prisma.assessmentType.deleteMany()
  
  await prisma.examResult.deleteMany()
  await prisma.examSubject.deleteMany()
  await prisma.exam.deleteMany()
  
  await prisma.classSubject.deleteMany()
  await prisma.teacherSubject.deleteMany()
  await prisma.subject.deleteMany()
  
  await prisma.studentPromotion.deleteMany()
  await prisma.reportCard.deleteMany()
  
  // Payment-related tables
  await prisma.transactionItem.deleteMany()
  await prisma.feeTransaction.deleteMany()
  await prisma.paymentBatchItem.deleteMany()
  await prisma.paymentBatch.deleteMany()
  await prisma.studentFeeSummary.deleteMany()
  await prisma.studentScholarship.deleteMany()
  await prisma.feeStructure.deleteMany()
  await prisma.classFeeTemplate.deleteMany()
  await prisma.feeTemplateItem.deleteMany()
  await prisma.feeTemplate.deleteMany()
  await prisma.feeType.deleteMany()
  
  await prisma.attendance.deleteMany()
  await prisma.announcementRead.deleteMany()
  await prisma.announcement.deleteMany()
  
  await prisma.classTerm.deleteMany()
  await prisma.academicTerm.deleteMany()
  
  await prisma.student.deleteMany()
  await prisma.guardian.deleteMany()
  
  await prisma.class.deleteMany()
  
  // Staff/Employee-related
  await prisma.employee.deleteMany()
  await prisma.parentProfile.deleteMany()
  await prisma.user.deleteMany()
  
  await prisma.schoolSettings.deleteMany()

  // Create default school settings
  console.log('🏫 Creating school settings...')
  await prisma.schoolSettings.create({
    data: {
      schoolName: 'Excellence Academy',
      schoolCode: 'EXA001',
      schoolAddress: '123 Education Lane, Accra, Ghana',
      schoolPhone: '+233 300 000 000',
      schoolEmail: 'info@excellenceacademy.edu.gh',
      schoolMotto: 'Excellence in Education',
      principalName: 'Dr. Samuel Osei',
      establishedYear: 2010,
      currentAcademicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      defaultTermType: 'FIRST_TERM',
      gradingSystem: 'STANDARD',
      defaultPassingMarks: 40,
      defaultTotalMarks: 100,
      defaultExamDuration: 60,
      enabledExamTypes: { MID_TERM: true, END_OF_TERM: true, MOCK: true, FINAL: true },
      allowParentLogin: true,
      allowStudentLogin: true,
      defaultLanguage: 'en',
      timezone: 'Africa/Accra',
    },
  })
  console.log('  ✅ School settings created')

  // Default password for all test users
  const defaultPassword = 'password123'
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)

  // Create users for each role - EXPANDED
  const users = [
    // Admins
    { email: 'super.admin@school.com', password: hashedPassword, firstName: 'Super', lastName: 'Admin', role: 'SUPER_ADMIN' as Role, phone: '+233 200 000 001' },
    { email: 'admin@school.com', password: hashedPassword, firstName: 'School', lastName: 'Administrator', role: 'ADMIN' as Role, phone: '+233 200 000 002' },
    { email: 'emk.appiah@gmail.com', password: await bcrypt.hash('Shiny-2-Music-Liver-Trend', 10), firstName: 'EMK', lastName: 'Appiah', role: 'ADMIN' as Role, phone: '+233 123 456 789' },
    
    // Employees (Teachers)
    { email: 'teacher.john@school.com', password: hashedPassword, firstName: 'John', lastName: 'Mensah', role: 'EMPLOYEE' as Role, phone: '+233 200 000 003' },
    { email: 'teacher.sarah@school.com', password: hashedPassword, firstName: 'Sarah', lastName: 'Owusu', role: 'EMPLOYEE' as Role, phone: '+233 200 000 004' },
    { email: 'teacher.michael@school.com', password: hashedPassword, firstName: 'Michael', lastName: 'Adjei', role: 'EMPLOYEE' as Role, phone: '+233 200 000 011' },
    { email: 'teacher.grace@school.com', password: hashedPassword, firstName: 'Grace', lastName: 'Tetteh', role: 'EMPLOYEE' as Role, phone: '+233 200 000 012' },
    { email: 'teacher.peter@school.com', password: hashedPassword, firstName: 'Peter', lastName: 'Nyarko', role: 'EMPLOYEE' as Role, phone: '+233 200 000 013' },
    
    // Accountant (Employee type ACCOUNTANT)
    { email: 'accountant@school.com', password: hashedPassword, firstName: 'Grace', lastName: 'Asante', role: 'EMPLOYEE' as Role, phone: '+233 200 000 005' },
    
    // Parents
    { email: 'parent.kofi@email.com', password: hashedPassword, firstName: 'Kofi', lastName: 'Amoako', role: 'PARENT' as Role, phone: '+233 200 000 006' },
    { email: 'parent.ama@email.com', password: hashedPassword, firstName: 'Ama', lastName: 'Boateng', role: 'PARENT' as Role, phone: '+233 200 000 007' },
    { email: 'parent.yaw@email.com', password: hashedPassword, firstName: 'Yaw', lastName: 'Asante', role: 'PARENT' as Role, phone: '+233 200 000 014' },
    { email: 'parent.efua@email.com', password: hashedPassword, firstName: 'Efua', lastName: 'Mensah', role: 'PARENT' as Role, phone: '+233 200 000 015' },
    { email: 'parent.kwesi@email.com', password: hashedPassword, firstName: 'Kwesi', lastName: 'Darko', role: 'PARENT' as Role, phone: '+233 200 000 016' },
    
    // Students
    ...Array.from({ length: 90 }, (_, i) => ({
      email: `student.student${i + 1}@school.com`,
      password: hashedPassword,
      firstName: '',
      lastName: '',
      role: 'STUDENT' as Role,
      phone: null as string | null,
    })),
  ]

  console.log(`📝 Creating ${users.length} users...`)

  const createdUsers = []
  
  for (const userData of users) {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName || `Student${(userData.email.split('student')[1]?.split('@')[0]) || ''}`,
        lastName: userData.lastName || 'Student',
        role: userData.role,
        phone: userData.phone,
        isActive: true,
      },
    })
    createdUsers.push(user)
    if (user.role !== 'STUDENT') {
      console.log(`  ✅ ${user.firstName} ${user.lastName} (${user.role}) - ${user.email}`)
    }
  }
  console.log(`  ✅ Created ${createdUsers.filter(u => u.role === 'STUDENT').length} student accounts`)

  // Create employee profiles (teachers and accountant)
  const employeeUsers = createdUsers.filter(u => u.role === 'EMPLOYEE')
  const createdEmployees = []
  
  const employeeQualifications = ['B.Ed Mathematics', 'M.Ed Science Education', 'B.Ed English', 'M.Ed Social Studies', 'B.Ed ICT']
  const employeeSubjectsList = [
    ['Mathematics', 'Physics'],
    ['Science', 'Biology'],
    ['English', 'Literature'],
    ['Social Studies', 'History'],
    ['ICT', 'Mathematics'],
  ]
  const departments = ['Science Department', 'Arts Department', 'Languages Department', 'Social Studies Department', 'ICT Department']
  
  for (let i = 0; i < employeeUsers.length; i++) {
    const employee = employeeUsers[i]
    const employeeType = i < employeeUsers.length - 1 ? 'TEACHER' as EmployeeType : 'ACCOUNTANT' as EmployeeType
    
    const employeeProfile = await prisma.employee.create({
      data: {
        userId: employee.id,
        employeeId: `EMP-${employee.lastName.toUpperCase()}-${Date.now()}-${i}`,
        employeeType: employeeType,
        department: employeeType === 'TEACHER' ? departments[i % departments.length] : 'Finance Department',
        position: employeeType === 'TEACHER' ? 'Subject Teacher' : 'Senior Accountant',
        joinDate: new Date(2024, 0, 15 + i),
        qualification: employeeType === 'TEACHER' ? employeeQualifications[i % employeeQualifications.length] : 'B.Com Accounting',
        subjects: employeeType === 'TEACHER' ? employeeSubjectsList[i % employeeSubjectsList.length] : [],
        salary: employeeType === 'TEACHER' ? 2500 : 3500,
        bankAccount: `ACC-${100000 + i}`,
      },
    })
    createdEmployees.push(employeeProfile)
    console.log(`  📚 Created employee profile for ${employee.firstName} ${employee.lastName} (${employeeType})`)
  }

  // Create parent profiles
  const parentUsers = createdUsers.filter(u => u.role === 'PARENT')
  const createdParents = []
  const parentOccupations = ['Business Owner', 'Teacher', 'Doctor', 'Engineer', 'Trader']
  const relationships = ['Father', 'Mother', 'Father', 'Mother', 'Guardian']
  
  for (let i = 0; i < parentUsers.length; i++) {
    const parent = parentUsers[i]
    const parentProfile = await prisma.parentProfile.create({
      data: {
        userId: parent.id,
        occupation: parentOccupations[i % parentOccupations.length],
        relationship: relationships[i % relationships.length],
      },
    })
    createdParents.push(parentProfile)
    console.log(`  👨‍👩‍👧 Created parent profile for ${parent.firstName} ${parent.lastName}`)
  }

  // Create academic terms
  console.log('📅 Creating academic terms...')
  const currentYear = new Date().getFullYear()
  const terms = [
    { name: `First Term ${currentYear}/${currentYear + 1}`, type: 'FIRST_TERM' as TermType, academicYear: `${currentYear}/${currentYear + 1}`, startDate: new Date(`${currentYear}-09-01`), endDate: new Date(`${currentYear}-12-15`), isActive: true },
    { name: `Second Term ${currentYear}/${currentYear + 1}`, type: 'SECOND_TERM' as TermType, academicYear: `${currentYear}/${currentYear + 1}`, startDate: new Date(`${currentYear + 1}-01-10`), endDate: new Date(`${currentYear + 1}-04-05`), isActive: false },
    { name: `Third Term ${currentYear}/${currentYear + 1}`, type: 'THIRD_TERM' as TermType, academicYear: `${currentYear}/${currentYear + 1}`, startDate: new Date(`${currentYear + 1}-04-25`), endDate: new Date(`${currentYear + 1}-07-20`), isActive: false },
  ]

  const createdTerms = []
  for (const termData of terms) {
    const term = await prisma.academicTerm.upsert({
      where: { type_academicYear: { type: termData.type, academicYear: termData.academicYear } },
      update: termData,
      create: termData,
    })
    createdTerms.push(term)
    console.log(`  ✅ Created term: ${term.name}`)
  }

  const activeTerm = createdTerms.find(t => t.isActive) || createdTerms[0]

  // Create subjects - GHANAIAN BASIC & JHS CURRICULUM
  console.log('📚 Creating subjects...')
  const subjectsData = [
    // Core Subjects
    { name: 'English Language', code: 'ENG101', category: 'Core', isActive: true },
    { name: 'Mathematics', code: 'MATH101', category: 'Core', isActive: true },
    { name: 'Integrated Science', code: 'SCI101', category: 'Core', isActive: true },
    { name: 'Social Studies', code: 'SST101', category: 'Core', isActive: true },
    { name: 'Religious & Moral Education', code: 'RME101', category: 'Core', isActive: true },
    { name: 'Ghanaian Language (Twi)', code: 'TWI101', category: 'Core', isActive: true },
    { name: 'Ghanaian Language (Ga)', code: 'GA101', category: 'Elective', isActive: true },
    { name: 'Ghanaian Language (Ewe)', code: 'EWE101', category: 'Elective', isActive: true },
    
    // Elective Subjects (JHS Level)
    { name: 'ICT', code: 'ICT101', category: 'Elective', isActive: true },
    { name: 'French', code: 'FRN101', category: 'Elective', isActive: true },
    { name: 'Basic Design & Technology (BDT)', code: 'BDT101', category: 'Elective', isActive: true },
    { name: 'Home Economics', code: 'HME101', category: 'Elective', isActive: true },
    { name: 'Physical Education', code: 'PHE101', category: 'Elective', isActive: true },
    { name: 'Creative Arts', code: 'ART101', category: 'Elective', isActive: true },
    { name: 'Career Technology', code: 'CTE101', category: 'Elective', isActive: true },
    
    // Early Childhood (Creche, Nursery, KG)
    { name: 'Literacy', code: 'LIT101', category: 'EarlyChildhood', isActive: true },
    { name: 'Numeracy', code: 'NUM101', category: 'EarlyChildhood', isActive: true },
    { name: 'Creative Activities', code: 'CRE101', category: 'EarlyChildhood', isActive: true },
    { name: 'Environmental Studies', code: 'ENV101', category: 'EarlyChildhood', isActive: true },
  ]

  const createdSubjects = []
  for (const subjectData of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { code: subjectData.code },
      update: subjectData,
      create: subjectData,
    })
    createdSubjects.push(subject)
    console.log(`  ✅ Created subject: ${subject.name} (${subject.code})`)
  }

  // Create standard Ghanaian classes (Creche, Nursery, P1-P6, JHS 1-3)
  // Create standard Ghanaian classes (Creche, Nursery, P1-P6, JHS 1-3)
  console.log('🏫 Creating Ghanaian Basic & JHS classes...')
  const classesData = [
    // Early Childhood (Creche & Nursery with streams)
    { name: 'Creche A', gradeLevel: 0, stream: 'A' },
    { name: 'Creche B', gradeLevel: 0, stream: 'B' },
    { name: 'Nursery A', gradeLevel: 1, stream: 'A' },
    { name: 'Nursery B', gradeLevel: 1, stream: 'B' },
    
    // Kindergarten (KG 1 & 2)
    { name: 'KG 1A', gradeLevel: 2, stream: 'A' },
    { name: 'KG 1B', gradeLevel: 2, stream: 'B' },
    { name: 'KG 2A', gradeLevel: 3, stream: 'A' },
    { name: 'KG 2B', gradeLevel: 3, stream: 'B' },
    
    // Primary (P1-P6)
    { name: 'P1 A', gradeLevel: 4, stream: 'A' },
    { name: 'P1 B', gradeLevel: 4, stream: 'B' },
    { name: 'P2 A', gradeLevel: 5, stream: 'A' },
    { name: 'P2 B', gradeLevel: 5, stream: 'B' },
    { name: 'P3 A', gradeLevel: 6, stream: 'A' },
    { name: 'P3 B', gradeLevel: 6, stream: 'B' },
    { name: 'P4 A', gradeLevel: 7, stream: 'A' },
    { name: 'P4 B', gradeLevel: 7, stream: 'B' },
    { name: 'P5 A', gradeLevel: 8, stream: 'A' },
    { name: 'P5 B', gradeLevel: 8, stream: 'B' },
    { name: 'P6 A', gradeLevel: 9, stream: 'A' },
    { name: 'P6 B', gradeLevel: 9, stream: 'B' },
    
    // Junior High School (JHS 1-3)
    { name: 'JHS 1A', gradeLevel: 10, stream: 'A' },
    { name: 'JHS 1B', gradeLevel: 10, stream: 'B' },
    { name: 'JHS 1C', gradeLevel: 10, stream: 'C' },
    { name: 'JHS 2A', gradeLevel: 11, stream: 'A' },
    { name: 'JHS 2B', gradeLevel: 11, stream: 'B' },
    { name: 'JHS 2C', gradeLevel: 11, stream: 'C' },
    { name: 'JHS 3A', gradeLevel: 12, stream: 'A' },
    { name: 'JHS 3B', gradeLevel: 12, stream: 'B' },
    { name: 'JHS 3C', gradeLevel: 12, stream: 'C' },
  ]

  const createdClasses = []
  const teachers = createdEmployees.filter(e => e.employeeType === 'TEACHER')
  
  // Keep track of which teachers have been assigned to classes
  let teacherIndex = 0
  
  for (let i = 0; i < classesData.length; i++) {
    const cls = classesData[i]
    
    // Assign class teachers (only for P1-JHS3 levels)
    let teacherId = undefined
    if (cls.gradeLevel >= 4 && teachers.length > 0) {
      // Only assign if we haven't assigned all teachers yet
      if (teacherIndex < teachers.length) {
        teacherId = teachers[teacherIndex]?.id
        teacherIndex++ // Move to next teacher for next class
      }
    }
    
    const createdClass = await prisma.class.create({
      data: {
        name: cls.name,
        gradeLevel: cls.gradeLevel,
        stream: cls.stream,
        teacherProfileId: teacherId,
      },
    })
    createdClasses.push(createdClass)
    console.log(`  ✅ Created class: ${createdClass.name} ${teacherId ? '(with class teacher)' : ''}`)
  }

  // Assign subjects to classes based on class level
  console.log('🔗 Assigning subjects to classes...')
  for (const cls of createdClasses) {
    let subjectsToAssign = []
    
    if (cls.gradeLevel <= 3) {
      // Early Childhood (Creche, Nursery, KG) - Basic subjects
      subjectsToAssign = createdSubjects.filter(s => 
        s.category === 'EarlyChildhood'
      )
    } else if (cls.gradeLevel >= 4 && cls.gradeLevel <= 9) {
      // Primary (P1-P6) - Core subjects
      subjectsToAssign = createdSubjects.filter(s => 
        s.category === 'Core'
      )
    } else {
      // JHS (JHS1-3) - Core + Electives
      subjectsToAssign = createdSubjects.filter(s => 
        s.category === 'Core' || s.category === 'Elective'
      )
    }
    
    for (const subject of subjectsToAssign) {
      await prisma.classSubject.upsert({
        where: { classId_subjectId: { classId: cls.id, subjectId: subject.id } },
        update: {},
        create: { classId: cls.id, subjectId: subject.id },
      })
    }
    console.log(`  ✅ Assigned ${subjectsToAssign.length} subjects to ${cls.name}`)
  }

  // Assign teachers to subjects
  console.log('👨‍🏫 Assigning teachers to subjects...')
  const teachingStaff = createdEmployees.filter(e => e.employeeType === 'TEACHER')
  for (let i = 0; i < teachingStaff.length; i++) {
    const teacher = teachingStaff[i]
    const classesForTeacher = createdClasses.filter(cls => cls.gradeLevel >= 4)
    for (let j = 0; j < Math.min(3, classesForTeacher.length); j++) {
      const cls = classesForTeacher[(i + j) % classesForTeacher.length]
      const subject = createdSubjects[i % createdSubjects.length]
      
      await prisma.teacherSubject.upsert({
        where: { teacherId_subjectId_classId: { teacherId: teacher.id, subjectId: subject.id, classId: cls.id } },
        update: {},
        create: { teacherId: teacher.id, subjectId: subject.id, classId: cls.id },
      })
    }
  }
  console.log(`  ✅ Assigned teachers to subjects`)

  // Create guardians for students
  console.log('👨‍👩‍👧 Creating guardians...')
  const guardians = []
  
  for (let i = 0; i < parentUsers.length; i++) {
    const parent = parentUsers[i]
    const guardian = await prisma.guardian.create({
      data: {
        name: `${parent.firstName} ${parent.lastName}`,
        phone: parent.phone || `+233 200 000 ${100 + i}`,
        email: parent.email,
        address: `${i + 1} Accra Street, Ghana`,
        parentProfileId: createdParents[i]?.id,
      },
    })
    guardians.push(guardian)
    console.log(`  ✅ Created guardian: ${guardian.name}`)
  }

  // Create students for all classes
  const studentUsers = createdUsers.filter(u => u.role === 'STUDENT')
  const createdStudents = []
  
  const firstNames = ['Kwame', 'Akosua', 'Adwoa', 'Kofi', 'Ama', 'Yaw', 'Efia', 'Kwabena', 'Abena', 'Kojo', 'Esi', 'Fiifi', 'Naa', 'Nii', 'Afua']
  const lastNames = ['Asare', 'Mensah', 'Danso', 'Agyeman', 'Sarpong', 'Boakye', 'Osei', 'Annan', 'Quaye', 'Sowah', 'Lartey', 'Ocran', 'Adoley', 'Armah', 'Asiedu']
  const genders = ['MALE', 'FEMALE', 'FEMALE', 'MALE', 'FEMALE', 'MALE', 'FEMALE', 'MALE', 'FEMALE', 'MALE', 'FEMALE', 'MALE', 'FEMALE', 'MALE', 'FEMALE']
  
  // Create about 5-10 students per class
  let studentCounter = 0
  for (const cls of createdClasses) {
    const numStudentsInClass = Math.floor(Math.random() * 6) + 5 // 5-10 students per class
    
    for (let i = 0; i < numStudentsInClass && studentCounter < studentUsers.length; i++) {
      const studentIndex = studentCounter % firstNames.length
      const guardianIndex = studentCounter % guardians.length
      const admissionNumber = `STU-${currentYear}-${cls.name.replace(/\s/g, '')}-${String(i + 1).padStart(2, '0')}`
      
      const student = await prisma.student.create({
        data: {
          admissionNumber,
          firstName: firstNames[studentIndex],
          lastName: lastNames[studentIndex % lastNames.length],
          dateOfBirth: new Date(2010 + (currentYear - 2024), studentIndex % 12, (studentIndex % 28) + 1),
          gender: genders[studentIndex % genders.length] as Gender,
          address: `${studentIndex + 1} School Lane, Ghana`,
          status: 'ACTIVE',
          classId: cls.id,
          guardianId: guardians[guardianIndex % guardians.length].id,
          userId: studentUsers[studentCounter]?.id,
        },
      })
      createdStudents.push(student)
      studentCounter++
      
      if (createdStudents.length <= 50) {
        console.log(`  🎓 Created student: ${student.firstName} ${student.lastName} (${student.admissionNumber}) - ${cls.name}`)
      }
    }
  }
  
  console.log(`  ✅ Created ${createdStudents.length} students across ${createdClasses.length} classes`)

  // Create assessment types
  console.log('📝 Creating assessment types...')
  const assessmentTypesData = [
    { name: 'Class Test', weight: 20, description: 'Regular class tests', isActive: true },
    { name: 'Quiz', weight: 15, description: 'Quick quizzes', isActive: true },
    { name: 'Project', weight: 25, description: 'Term projects', isActive: true },
    { name: 'Homework', weight: 10, description: 'Daily homework', isActive: true },
  ]
  
  const createdAssessmentTypes = []
  for (const typeData of assessmentTypesData) {
    const type = await prisma.assessmentType.upsert({
      where: { name: typeData.name },
      update: typeData,
      create: typeData,
    })
    createdAssessmentTypes.push(type)
    console.log(`  ✅ Created assessment type: ${type.name} (${type.weight}%)`)
  }

  // Create sample assessments for primary and JHS classes
  console.log('📋 Creating sample assessments...')
  const primaryAndJHSClasses = createdClasses.filter(cls => cls.gradeLevel >= 4)
  for (let i = 0; i < Math.min(20, primaryAndJHSClasses.length); i++) {
    const cls = primaryAndJHSClasses[i]
    const subject = createdSubjects[i % createdSubjects.length]
    const type = createdAssessmentTypes[i % createdAssessmentTypes.length]
    
    await prisma.assessment.create({
      data: {
        typeId: type.id,
        subjectId: subject.id,
        classId: cls.id,
        termId: activeTerm.id,
        name: `${type.name} ${i + 1} - ${subject.name}`,
        totalMarks: type.name === 'Project' ? 100 : (type.name === 'Class Test' ? 50 : 20),
        date: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)),
      },
    })
  }
  console.log(`  ✅ Created sample assessments`)

  // Create fee types
  console.log('💰 Creating fee types...')
  const feeTypesData = [
    { name: 'Tuition Fee', category: 'TUITION' as FeeCategory, isActive: true },
    { name: 'PTA Dues', category: 'PTA' as FeeCategory, isActive: true },
    { name: 'Canteen Fee', category: 'CANTEEN' as FeeCategory, isActive: true },
    { name: 'Sports Fee', category: 'SPORTS' as FeeCategory, isActive: true },
    { name: 'Exam Fee', category: 'EXAM' as FeeCategory, isActive: true },
    { name: 'ICT Fee', category: 'ICT' as FeeCategory, isActive: true },
    { name: 'Development Levy', category: 'OTHER' as FeeCategory, isActive: true },
  ]

  const createdFeeTypes = []
  for (const feeTypeData of feeTypesData) {
    const feeType = await prisma.feeType.upsert({
      where: { name: feeTypeData.name },
      update: feeTypeData,
      create: feeTypeData,
    })
    createdFeeTypes.push(feeType)
    console.log(`  ✅ Created fee type: ${feeType.name}`)
  }

  // Create fee template
  console.log('📋 Creating fee template...')
  const feeTemplate = await prisma.feeTemplate.create({
    data: {
      name: 'Standard Fee Template',
      description: 'Standard fee structure for all classes',
      isActive: true,
      isDefault: true,
      items: {
        create: createdFeeTypes.map(feeType => ({
          feeTypeId: feeType.id,
          amount: feeType.name === 'Tuition Fee' ? 1200 : 
                  feeType.name === 'Development Levy' ? 300 :
                  feeType.name === 'PTA Dues' ? 200 :
                  feeType.name === 'Canteen Fee' ? 150 :
                  feeType.name === 'Sports Fee' ? 100 :
                  feeType.name === 'Exam Fee' ? 80 : 60,
          isOptional: feeType.name === 'Canteen Fee',
        })),
      },
    },
  })
  console.log(`  ✅ Created fee template: ${feeTemplate.name}`)

  // Assign fees to all primary and JHS classes
  console.log('📋 Assigning fees to classes...')
  const classesForFees = createdClasses.filter(cls => cls.gradeLevel >= 4)
  for (const cls of classesForFees) {
    await prisma.classFeeTemplate.create({
      data: {
        templateId: feeTemplate.id,
        classId: cls.id,
        termId: activeTerm.id,
        isActive: true,
      },
    })
  }
  console.log(`  ✅ Assigned fees to ${classesForFees.length} classes`)

  // Create announcements
  console.log('📢 Creating announcements...')
  const adminUser = createdUsers.find(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')
  if (adminUser) {
    await prisma.announcement.create({
      data: {
        title: 'Welcome to the New Academic Year!',
        content: 'We are excited to welcome all students and staff back for the new academic year. Classes begin on Monday. Please ensure all fees are paid before the deadline.',
        priority: 'HIGH',
        audience: 'ALL',
        authorId: adminUser.id,
      },
    })
    
    await prisma.announcement.create({
      data: {
        title: 'Parent-Teacher Meeting',
        content: 'There will be a parent-teacher meeting next Friday at 2:00 PM in the school auditorium. All parents are encouraged to attend.',
        priority: 'MEDIUM',
        audience: 'PARENTS',
        authorId: adminUser.id,
      },
    })
    
    await prisma.announcement.create({
      data: {
        title: 'Mid-Term Exams Schedule',
        content: 'Mid-term examinations will commence next Monday. The timetable has been posted on the notice board and online portal.',
        priority: 'HIGH',
        audience: 'STUDENTS',
        authorId: adminUser.id,
      },
    })
    console.log(`  ✅ Created announcements`)
  }

  console.log('')
  console.log('✅ SEED COMPLETED SUCCESSFULLY!')
  console.log('')
  console.log('📊 SUMMARY:')
  console.log('─'.repeat(50))
  console.log(`  👥 Users: ${createdUsers.length}`)
  console.log(`  👨‍🏫 Employees: ${createdEmployees.length} (${createdEmployees.filter(e => e.employeeType === 'TEACHER').length} teachers, ${createdEmployees.filter(e => e.employeeType === 'ACCOUNTANT').length} accountant)`)
  console.log(`  🏫 Classes: ${createdClasses.length}`)
  console.log(`     - Early Childhood (Creche/Nursery/KG): ${createdClasses.filter(c => c.gradeLevel <= 3).length}`)
  console.log(`     - Primary (P1-P6): ${createdClasses.filter(c => c.gradeLevel >= 4 && c.gradeLevel <= 9).length}`)
  console.log(`     - JHS (JHS1-3): ${createdClasses.filter(c => c.gradeLevel >= 10).length}`)
  console.log(`  📚 Subjects: ${createdSubjects.length}`)
  console.log(`  🎓 Students: ${createdStudents.length}`)
  console.log('─'.repeat(50))
  console.log('')
  console.log('📋 TEST CREDENTIALS:')
  console.log('─'.repeat(50))
  console.log('  Main Admin:')
  console.log('    Email:    emk.appiah@gmail.com')
  console.log('    Password: Shiny-2-Music-Liver-Trend')
  console.log('')
  console.log('  Super Admin:')
  console.log('    Email:    super.admin@school.com')
  console.log('    Password: password123')
  console.log('')
  console.log('  Teacher:')
  console.log('    Email:    teacher.john@school.com')
  console.log('    Password: password123')
  console.log('')
  console.log('  Accountant:')
  console.log('    Email:    accountant@school.com')
  console.log('    Password: password123')
  console.log('')
  console.log('  Parent:')
  console.log('    Email:    parent.kofi@email.com')
  console.log('    Password: password123')
  console.log('')
  console.log('  Student:')
  console.log('    Email:    student.student1@school.com')
  console.log('    Password: password123')
  console.log('─'.repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })