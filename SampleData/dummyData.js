const insertDummyData = (db, transactions_db) => {


    var bool_data = false;
    db.query(`insert into Roles (role) values ("SUPER")`);
    db.query(`insert into Roles (role) values ("ADMIN")`);
    db.query(`insert into Roles (role) values ("EWHEAD")`);
    db.query(`insert into Roles (role) values ("FINANCE")`);
    db.query(`insert into Roles (role) values ("DEPTHEAD")`);
    db.query(`insert into Roles (role) values ("FACCOORD")`);
    db.query(`insert into Roles (role) values ("STDCOORD")`);
    db.query(`insert into Roles (role) values ("EVNTDREG")`);
    db.query(`insert into Roles (role) values ("SECURITY")`);
    db.query(`insert into Roles (role) values ("REGHEAD")`);
    var date_time = new Date().toISOString().slice(0, 19).replace('T', ' ')
    db.query(`insert into EventManager (userName,userEmail,name,password,timeStamp,phoneNumber,role) values ('SUPER_VAI_ANK_2023','cb.en.u4cse20069@cb.students.amrita.edu','Vaisakhkrishnan K','73huh73udjij73973jisih','${date_time}','8129348583','SUPER')`); 
    db.query(`insert into EventManager (userName,userEmail,name,password,timeStamp,phoneNumber,role) values ('SUPER_SHR_ANK_2023','cb.en.u4cse20159@cb.students.amrita.edu','Sharath S R','ihwegu8yei3dhiwehdiuyd','${date_time}','9597197934','SUPER')`); 



    //ADMIN ==> All data with all regsieterd users
    //EWHEAD ==> All data from that event 
    //DEPTHEAD ==> All department related events
    //FACCOORD ==> Particular event
    //STUDENTCOORD ==> Particular coordinator
    //EVENTIDEREG ==> registration for eventide
    //SECURITY ==> Scanning
    //FINANCE ==> Statistics
   

    //events dept
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('EEE', 'Electrical and Electronics Engineering')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('MEE', 'Mechanical Engineering')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('CYS', 'Cyber Security')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('MATH', 'Mathematics')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('ECE', 'Electronics and Communication Engineering')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('CSE', 'Computer Science and Engineering')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('MSW', 'Social Work')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('CIE', 'Civil Engineering')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('AGRI', 'Agriculture')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('ENG', 'English')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('CHE', 'Chemical Engineering')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('AEE', 'Aerospace Engineering')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('CEN', 'Computational Engineering and Networking')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('TM', 'Team Media - Club')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('ACE', 'Amrita Center for Entrepreneurship')`);

    //workshop
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('ASPS', 'Amrita School of Physical Sciences')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('NIV', 'Nivesha - Club')`);
    db.query(`insert into DepartmentData (departmentAbbr, departmentName) values ('ASCOM', 'Amrita School of Communication')`);



}


module.exports = insertDummyData;

